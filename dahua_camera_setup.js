// Al principio del archivo, después del require de ffmpeg
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('./ffmpeg.exe'); // Usar FFmpeg local

// test-camera.js - Script para probar tu cámara Dahua
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Tu configuración específica
const CAMERA_CONFIG = {
  ip: '192.168.1.41',
  username: 'admin',
  password: 'L26CD107',
  // URLs RTSP típicas para Dahua:
  mainStream: 'rtsp://admin:L26CD107@192.168.1.41:554/cam/realmonitor?channel=1&subtype=0',
  subStream: 'rtsp://admin:L26CD107@192.168.1.41:554/cam/realmonitor?channel=1&subtype=1'
};

// Función para probar conexión RTSP
function testRTSPConnection(streamUrl, streamName) {
  console.log(`\n🔍 Probando ${streamName}...`);
  console.log(`URL: ${streamUrl}`);

  return new Promise((resolve) => {
    ffmpeg(streamUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp',
        '-analyzeduration', '2000000',
        '-probesize', '2000000'
      ])
      .outputOptions([
        '-t', '3', // Solo 3 segundos de prueba
        '-f', 'null'
      ])
      .output('-')
      .on('start', () => {
        console.log(`⏳ Conectando a ${streamName}...`);
      })
      .on('end', () => {
        console.log(`✅ ${streamName} funciona correctamente`);
        resolve(true);
      })
      .on('error', (err) => {
        console.log(`❌ Error en ${streamName}:`, err.message);
        resolve(false);
      })
      .run();
  });
}

// Función para grabar un video de prueba
function recordTestVideo(streamUrl, duration = 30) {
  const filename = `test_dahua_${Date.now()}.mp4`;
  const outputPath = `./public/recordings/${filename}`;

  // Crear directorio si no existe
  if (!fs.existsSync('./public/recordings')) {
    fs.mkdirSync('./public/recordings', { recursive: true });
  }

  console.log(`\n🎬 Grabando video de prueba por ${duration} segundos...`);
  console.log(`Archivo: ${outputPath}`);

  return new Promise((resolve, reject) => {
    ffmpeg(streamUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp',
        '-analyzeduration', '2000000',
        '-probesize', '2000000'
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-t', duration.toString()
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg comando:', commandLine.substring(0, 100) + '...');
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0);
        process.stdout.write(`\r⏳ Progreso: ${percent}%`);
      })
      .on('end', () => {
        console.log(`\n✅ Video grabado exitosamente: ${filename}`);
        resolve(filename);
      })
      .on('error', (err) => {
        console.log(`\n❌ Error grabando:`, err.message);
        reject(err);
      })
      .run();
  });
}

// Función principal de prueba
async function testDahuaCamera() {
  console.log('🚀 Iniciando pruebas de cámara Dahua');
  console.log(`📍 IP: ${CAMERA_CONFIG.ip}`);
  console.log(`👤 Usuario: ${CAMERA_CONFIG.username}`);

  try {
    // Probar stream principal
    const mainStreamWorks = await testRTSPConnection(
      CAMERA_CONFIG.mainStream, 
      'Stream Principal (Alta calidad)'
    );

    // Probar stream secundario
    const subStreamWorks = await testRTSPConnection(
      CAMERA_CONFIG.subStream, 
      'Stream Secundario (Baja calidad)'
    );

    if (mainStreamWorks) {
      console.log('\n🎥 Grabando video de prueba con stream principal...');
      await recordTestVideo(CAMERA_CONFIG.mainStream, 15);
    } else if (subStreamWorks) {
      console.log('\n🎥 Grabando video de prueba con stream secundario...');
      await recordTestVideo(CAMERA_CONFIG.subStream, 15);
    } else {
      console.log('\n❌ Ningún stream funciona. Verifica:');
      console.log('1. Que la cámara esté encendida y conectada');
      console.log('2. Que las credenciales sean correctas');
      console.log('3. Que RTSP esté habilitado en la cámara');
      return;
    }

    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('\nPróximos pasos:');
    console.log('1. Verifica el video grabado en public/recordings/');
    console.log('2. Si funciona bien, podemos configurar la grabación automática');
    
  } catch (error) {
    console.error('\n💥 Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testDahuaCamera();
}

module.exports = {
  CAMERA_CONFIG,
  testRTSPConnection,
  recordTestVideo,
  testDahuaCamera
};