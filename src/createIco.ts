const sharp = require("sharp");
const fs = require("fs");

const inputImagePath = "mate.png"; // Ruta de la imagen de entrada
const outputIcoPath = "favicon.ico"; // Ruta del archivo .ico de salida

// Función para convertir la imagen en un archivo .ico
sharp(inputImagePath)
	.resize(256, 256) // Ajusta el tamaño según tus necesidades
	// @ts-expect-error
	.toFile(outputIcoPath, (err, info) => {
		if (err) {
			console.error("Error al crear el archivo .ico:", err);
		} else {
			console.log("¡Archivo .ico creado con éxito!", info);
		}
	});
