// Firebase web configuration is public application metadata, not an admin credential.
const cloudConfig = {
  apiKey: 'AIzaSyC5XF21FdaQVNjB2rbsJINbJsqkkFkDOUk',
  authDomain: 'index-5a9bb.firebaseapp.com',
  projectId: 'index-5a9bb',
  databaseURL: 'https://index-5a9bb-default-rtdb.asia-southeast1.firebasedatabase.app',
  storageBucket: 'index-5a9bb.firebasestorage.app',
  messagingSenderId: '280057854419',
  appId: '1:280057854419:web:8c168190908154ce689726'
};
const useEmulators = typeof location !== 'undefined' && ['localhost','127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('emulator')==='1';
export const firebaseConfig = useEmulators ? {
  apiKey: 'demo-design-gym-key',
  authDomain: 'demo-design-gym.firebaseapp.com',
  projectId: 'demo-design-gym',
  databaseURL: 'https://demo-design-gym-default-rtdb.firebaseio.com',
  appId: '1:123456789:web:designgymdemo'
} : cloudConfig;
// Explicit local testing remains available; deployed origins never use emulators.
export const firebaseEmulators = useEmulators ? {auth:{host:'127.0.0.1',port:9099},database:{host:'127.0.0.1',port:9000}} : null;
