import fs from 'fs';
import path from 'path';

async function downloadFile(url: string, dest: string) {
  console.log(`Downloading ${url} -> ${dest}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
  console.log(`Saved ${dest} (${buffer.byteLength} bytes)`);
}

async function main() {
  const panDir = path.resolve(process.cwd(), 'public', 'panoramas');
  const modDir = path.resolve(process.cwd(), 'public', 'models');

  // Scene 1: Master Suite / Bedroom 360 equirectangular
  await downloadFile(
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/2294472375_24a3b8ef46_o.jpg',
    path.join(panDir, 'suite-bedroom-360.jpg')
  );

  // Scene 2: Living Lounge 360 equirectangular
  await downloadFile(
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/kandao3.jpg',
    path.join(panDir, 'suite-lounge-360.jpg')
  );

  // 3D Model: Sheen chair / designer furniture room piece
  await downloadFile(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    path.join(modDir, 'luxury-armchair.glb')
  );

  // 3D Model 2: Lantern / accent piece
  await downloadFile(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
    path.join(modDir, 'room-lantern.glb')
  );

  console.log('All local sample assets downloaded successfully!');
}

main().catch(console.error);
