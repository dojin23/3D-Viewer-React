# 3D Terrain Viewer

## Overview

The 3D Terrain Viewer is a web application built with React and Three.js that allows users to upload Digital Surface Model (DSM) and Imagery TIFF files to create a 3D visualization of a terrain. The application reads the TIFF files, processes the elevation and imagery data, and combines them to display a detailed 3D terrain model.

## Features

- **Upload DSM and Imagery Files**: Users can upload DSM and Imagery TIFF files to generate a 3D terrain model.
- **Real-Time 3D Rendering**: Utilizes Three.js for real-time rendering of the 3D terrain model.
- **Interactive Controls**: Includes orbit controls for zooming, panning, and rotating the view.
- **Rotation Feature**: Allows the user to rotate the imagery layer by 90 degrees at a time to align the map correctly.
- **Log Messages**: Displays log messages to provide feedback on the upload and processing status.

## Installation

To run the 3D Terrain Viewer locally, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd 3D-Viewer-React
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Start the Application**:
    ```bash
    npm start
    ```

4. **Open in Browser**:
    Open your browser and navigate to `http://localhost:3000`.

## Usage

1. **Upload Files**:
   - Click on the "Choose File" button under "DSM TIFF" to upload a DSM file.
   - Click on the "Choose File" button under "Imagery TIFF" to upload an imagery file.

2. **Combine and View 3D**:
   - After selecting the files, click on the "Combine and View 3D" button to process the files and display the 3D terrain.

3. **Rotate Imagery**:
   - Use the "Rotate 90°" button to rotate the imagery layer by 90 degrees to ensure proper alignment.

4. **View Logs**:
   - The log section at the bottom displays the processing steps and any errors encountered during the process.

## File Structure

- **src**: Contains the main source code for the application.
  - **App.jsx**: Main React component that handles the file upload, processing, and rendering of the 3D terrain.
  - **App.css**: CSS file for styling the application.
- **public**: Contains the public assets for the application.

## Technologies Used

- **React**: JavaScript library for building user interfaces.
- **Three.js**: JavaScript library for 3D graphics.
- **GeoTIFF.js**: Library for reading and parsing GeoTIFF files.

## Acknowledgments

This project utilizes the following libraries:
- [Three.js](https://threejs.org/)
- [GeoTIFF.js](https://geotiffjs.github.io/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
