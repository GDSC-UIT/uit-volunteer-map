import config from '../../../packages/backend/eslint.config.js';
export default config.map(item => item.files ? {...item,files:['**/*.ts']} : item);
