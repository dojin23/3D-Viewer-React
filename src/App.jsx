import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { fromArrayBuffer } from 'geotiff';
import './App.css';

function App() {
  const [dsmFile, setDsmFile] = useState(null);
  const [imageryFile, setImageryFile] = useState(null);
  const [logMessages, setLogMessages] = useState([]);
  const [rotation, setRotation] = useState(0);
  const viewerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const terrainRef = useRef();

  useEffect(() => {
    initThree();
    animate();
    window.addEventListener('resize', onWindowResize);
    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  const logOutput = (message) => {
    setLogMessages((prevMessages) => [...prevMessages, message]);
  };

  const initThree = () => {
    logOutput('Initializing Three.js...');
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      viewerRef.current.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1).normalize();
      scene.add(directionalLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = true;
      controls.minDistance = 1;
      controls.maxDistance = 1000;
      controls.maxPolarAngle = Math.PI;

      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      controlsRef.current = controls;

      logOutput('Three.js initialized successfully');
    } catch (error) {
      logOutput('Error initializing Three.js: ' + error.message);
    }
  };

  const onWindowResize = () => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const readGeoTIFF = async (file) => {
    logOutput(`Reading GeoTIFF file: ${file.name}`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      logOutput('File read as ArrayBuffer');
      const tiff = await fromArrayBuffer(arrayBuffer);
      logOutput('GeoTIFF parsed');
      const image = await tiff.getImage();
      logOutput(`Image dimensions: ${image.getWidth()}x${image.getHeight()}`);
      const data = await image.readRasters();
      logOutput('Rasters read successfully');
      return {
        width: image.getWidth(),
        height: image.getHeight(),
        data: data
      };
    } catch (error) {
      logOutput(`Error reading GeoTIFF ${file.name}: ${error.message}`);
      throw error;
    }
  };

  const handleCombine3D = async () => {
    logOutput('Starting 3D combination process...');
    if (!dsmFile || !imageryFile) {
      logOutput('Error: Please select both DSM and Imagery files');
      alert('Please select both DSM and Imagery files');
      return;
    }

    try {
      logOutput('Reading DSM file...');
      const dsm = await readGeoTIFF(dsmFile);
      logOutput('DSM file processed');

      logOutput('Reading Imagery file...');
      const imagery = await readGeoTIFF(imageryFile);
      logOutput('Imagery file processed');

      if (dsm.width !== imagery.width || dsm.height !== imagery.height) {
        logOutput(`Error: Dimension mismatch. DSM: ${dsm.width}x${dsm.height}, Imagery: ${imagery.width}x${imagery.height}`);
        alert('DSM and Imagery dimensions do not match');
        return;
      }

      logOutput('Creating terrain...');
      await createTerrain(dsm, imagery);
    } catch (error) {
      logOutput('Error in handleCombine3D: ' + error.message);
      console.error('Error processing files:', error);
      alert('Error processing files. Check console and log for details.');
    }
  };

  const createTerrain = async (dsm, imagery) => {
    logOutput('Creating terrain mesh...');
    try {
      if (terrainRef.current) sceneRef.current.remove(terrainRef.current);

      const geometryWidth = dsm.width / 10;
      const geometryHeight = dsm.height / 10;
      logOutput(`Creating geometry with dimensions: ${geometryWidth} x ${geometryHeight}`);
      const geometry = new THREE.PlaneGeometry(
        geometryWidth,
        geometryHeight,
        dsm.width - 1,
        dsm.height - 1
      );

      logOutput('Applying elevation data...');
      const vertices = geometry.attributes.position.array;
      logOutput(`Vertex array length: ${vertices.length}`);

      logOutput('Calculating elevation range...');
      let minElevation = Infinity;
      let maxElevation = -Infinity;
      for (let i = 0; i < dsm.data[0].length; i++) {
        if (dsm.data[0][i] < minElevation) minElevation = dsm.data[0][i];
        if (dsm.data[0][i] > maxElevation) maxElevation = dsm.data[0][i];
      }
      logOutput(`Elevation range: ${minElevation} to ${maxElevation}`);

      const elevationScale = geometryWidth / 5;

      logOutput('Processing elevation data...');
      for (let i = 0; i < vertices.length; i += 3) {
        const j = (i / 3);
        const normalizedElevation = (dsm.data[0][j] - minElevation) / (maxElevation - minElevation);
        vertices[i + 2] = normalizedElevation * elevationScale;
      }

      logOutput('Computing vertex normals...');
      geometry.computeVertexNormals();

      logOutput('Creating texture from imagery...');
      const textureData = new Uint8ClampedArray(dsm.width * dsm.height * 4);
      for (let i = 0; i < imagery.data[0].length; i++) {
        const textureIndex = i * 4;
        const rowIndex = Math.floor(i / dsm.width);
        const colIndex = i % dsm.width;
        const rotatedIndex = (rotation % 2 === 0)
          ? (rotation === 0 ? i : (dsm.width * dsm.height - 1 - i)) // 0° or 180°
          : (rotation === 1 ? (dsm.width * (rowIndex + 1) - 1 - colIndex) : (dsm.width * (dsm.height - 1 - rowIndex) + colIndex)); // 90° or 270°

        textureData[textureIndex] = imagery.data[0][rotatedIndex];     // R
        textureData[textureIndex + 1] = imagery.data[1][rotatedIndex]; // G
        textureData[textureIndex + 2] = imagery.data[2][rotatedIndex]; // B
        textureData[textureIndex + 3] = 255; // Alpha
      }

      logOutput('Creating Three.js texture...');
      const texture = new THREE.DataTexture(textureData, dsm.width, dsm.height, THREE.RGBAFormat);
      texture.needsUpdate = true;
      logOutput('Texture created');

      logOutput('Creating material...');
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        wireframe: false,
        side: THREE.DoubleSide
      });

      logOutput('Creating mesh...');
      const terrain = new THREE.Mesh(geometry, material);
      terrainRef.current = terrain;
      sceneRef.current.add(terrain);
      logOutput('Terrain added to scene');

      logOutput('Positioning camera...');
      const terrainSize = new THREE.Vector3();
      terrain.geometry.computeBoundingBox();
      terrain.geometry.boundingBox.getSize(terrainSize);
      const terrainCenter = new THREE.Vector3();
      terrain.geometry.boundingBox.getCenter(terrainCenter);

      const maxDimension = Math.max(terrainSize.x, terrainSize.y, terrainSize.z);
      cameraRef.current.position.set(
        terrainCenter.x,
        terrainCenter.y + maxDimension,
        terrainCenter.z + maxDimension
      );
      controlsRef.current.target.copy(terrainCenter);
      controlsRef.current.update();
      logOutput('Camera positioned');

      logOutput('Terrain creation complete');
    } catch (error) {
      logOutput('Error in createTerrain: ' + error.message);
      throw error;
    }
  };

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 1) % 4); // Update rotation state
    if (terrainRef.current) {
      handleCombine3D(); // Recreate terrain to apply new rotation
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    controlsRef.current.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div id="controls" style={{ flexShrink: 0 }}>
        <input
          type="file"
          id="dsmFile"
          accept=".tif,.tiff"
          onChange={(e) => setDsmFile(e.target.files[0])}
        />
        <label htmlFor="dsmFile">DSM TIFF</label><br /><br />
        <input
          type="file"
          id="imageryFile"
          accept=".tif,.tiff"
          onChange={(e) => setImageryFile(e.target.files[0])}
        />
        <label htmlFor="imageryFile">Imagery TIFF</label><br /><br />
        <button onClick={handleCombine3D}>Combine and View 3D</button>
        <button onClick={handleRotate}>Rotate 90°</button>
      </div>
      <div ref={viewerRef} style={{ flex: 1 }}></div>
      <div id="log" style={{ flexShrink: 0, overflowY: 'scroll', background: '#000', color: '#fff', padding: '10px' }}>
        {logMessages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
    </div>
  );

}

export default App;
