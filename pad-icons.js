import sharp from 'sharp';

const source = '../1783101832046_vectorized.png';

const densities = [
  { name: 'mdpi', size: 108 },
  { name: 'hdpi', size: 162 },
  { name: 'xhdpi', size: 216 },
  { name: 'xxhdpi', size: 324 },
  { name: 'xxxhdpi', size: 432 },
];

for (const { name, size } of densities) {
  const contentSize = Math.round(size * 0.56);
  const outDir = `android/app/src/main/res/mipmap-${name}`;

  // 创建 padded foreground: 透明背景 + 居中的图标
  const foreground = await sharp(source)
    .resize(contentSize, contentSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const foregroundPadded = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: foreground, gravity: 'centre' }])
    .png()
    .toBuffer();

  await sharp(foregroundPadded).toFile(`${outDir}/ic_launcher_foreground.png`);

  // ic_launcher: 白色圆角方形背景 + 居中图标
  const bgSize = Math.round(size * 0.75);
  const bgBuffer = await sharp({
    create: { width: bgSize, height: bgSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
  }).png().toBuffer();

  const roundedBg = await sharp(bgBuffer)
    .resize(bgSize, bgSize)
    .composite([{ input: foreground, gravity: 'centre' }])
    .png()
    .toBuffer();

  const icLauncher = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: roundedBg, gravity: 'centre' }])
    .png()
    .toBuffer();

  await sharp(icLauncher).toFile(`${outDir}/ic_launcher.png`);
  await sharp(icLauncher).toFile(`${outDir}/ic_launcher_round.png`);

  console.log(`Done: ${name} (${size}x${size})`);
}
