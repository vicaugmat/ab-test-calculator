const fs = require('fs');
const path = require('path');

// Crear la carpeta docs si no existe
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs');
}

// Copiar todo el contenido de la carpeta build a docs
copyFolderSync('build', 'docs');

function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      copyFolderSync(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

console.log('Contenido copiado de build a docs exitosamente!');
