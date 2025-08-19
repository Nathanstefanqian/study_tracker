import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import WindiCSS from 'vite-plugin-windicss';
import MiniProgramTailwind from '@dcasia/mini-program-tailwind-webpack-plugin/rollup';


export default defineConfig({
  plugins: [uni(),
    WindiCSS(),
    MiniProgramTailwind(),
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
      ],
      imports: [
          'vue',
          'uni-app',
          'pinia',
      ],
      dts: 'auto-imports.d.ts',
  }),
  Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: 'components.d.ts',
  }),
  ],
  build: {
    watch: {
      exclude: ['node_modules/**', '/__uno.css']
    }
  }
})
