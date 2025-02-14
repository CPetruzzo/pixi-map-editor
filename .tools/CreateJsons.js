const fs = require('fs');
const path = require('path');

const directoryToWatch = './src/project/scenes/LDTKScene/';

// Función para generar o sobreescribir el archivo JSON a partir del archivo LDtk
function generateJsonFromldtk(ldtkFilePath) {
    // Verificar si existe el archivo ldtk
    if (!fs.existsSync(ldtkFilePath)) {
        console.error(`El archivo ${ldtkFilePath} no existe.`);
        return;
    }

    // Generar el nombre del archivo JSON
    const jsonFilePath = ldtkFilePath.replace('.ldtk', '.json');

    // Copiar el contenido del archivo ldtk al archivo JSON
    fs.copyFile(ldtkFilePath, jsonFilePath, (err) => {
        if (err) {
            console.error(`Error al copiar el archivo: ${err}`);
            return;
        }
        console.log(`Archivo JSON generado: ${jsonFilePath}`);
    });
}

// Función para observar cambios en el directorio
function watchDirectory(directoryPath) {
    fs.watch(directoryPath, (eventType, fileName) => {
        // Verificar si el evento es una modificación de archivo y si el archivo modificado es un archivo .ldtk
        if (eventType === 'change' && fileName && path.extname(fileName) === '.ldtk') {
            const ldtkFilePath = path.join(directoryPath, fileName);
            console.log(`Archivo modificado: ${ldtkFilePath}`);

            // Generar o sobreescribir el archivo JSON correspondiente
            generateJsonFromldtk(ldtkFilePath);
        }
    });

    console.log(`Observando cambios en el directorio: ${directoryPath}`);
}

// Iniciar la observación del directorio
watchDirectory(directoryToWatch);
