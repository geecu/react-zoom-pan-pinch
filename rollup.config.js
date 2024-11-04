import babel from "@rollup/plugin-babel";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import dts from "rollup-plugin-dts";
import pkg from "./package.json";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(__filename);

async function copyDirectory(srcDir, destDir) {
  try {
    await fs.mkdir(destDir, { recursive: true });

    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        console.log('copied', srcPath, 'into', destPath);
        await fs.copyFile(srcPath, destPath);
      }
    }

    console.log(`Directory copied from ${srcDir} to ${destDir}`);
  } catch (err) {
    console.error(`Error copying directory: ${err}`);
  }
}

export default [
  {
    input: pkg.source,
    output: [
      {
        file: pkg.main,
        format: "cjs",
        exports: "named",
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: "es",
        exports: "named",
        sourcemap: true,
      },
    ],
    plugins: [
      myCustomPlugin(),
      external(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      del({ targets: ["dist/*"] }),
      typescript({ declaration: false }),
      postcss({
        modules: true,
      }),
    ],
    onwarn(error, warn) {
      if (error.code !== "CIRCULAR_DEPENDENCY") {
        warn(error);
      }
    },
    external: Object.keys(pkg.peerDependencies || {}),
  },
  {
    input: pkg.source,
    output: [{ file: pkg.types, format: "es" }],
    plugins: [
      external(),
      dts({
        compilerOptions: {
          baseUrl: "./src",
        },
      }),
    ],
  },
];

function myCustomPlugin() {
  return {
    name: 'my-custom-plugin',
    buildEnd() {
      console.log('Build is done!');
      setTimeout(() => {
        copyDirectory(__dirname + '/dist', '../../mmn/app/react-zoom-pan-pinch');
      }, 1000);
    }
  };
}

