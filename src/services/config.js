import { Platform } from 'react-native';

// Change this to your server URL
const API_URL = Platform.select({
  android: 'http://bespokeuisp.dedicated.co.za',
  ios: 'http://bespokeuisp.dedicated.co.za',
  default: 'http://bespokeuisp.dedicated.co.za',
});

export default API_URL;