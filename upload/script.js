// Initialize Firebase
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const submitPasswordButton = document.getElementById('submitPassword');
const passwordError = document.getElementById('passwordError');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const uploadStatus = document.getElementById('uploadStatus');

let userName = '';

submitPasswordButton.addEventListener('click', async () => {
    const password = passwordInput.value;
    if (!password) {
        passwordError.textContent = 'Please enter a password.';
        return;
    }

    try {
        const response = await fetch(`/api/fetchData?password=${encodeURIComponent(password)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data.');
        }

        const data = await response.json();
        if (data.isMaster) {
            passwordError.textContent = 'Master password is not allowed for uploads.';
            return;
        }
        userName = data.userName; 
        passwordModal.style.display = 'none';
        uploadForm.classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        passwordError.textContent = error.message;
    }
});

uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        uploadStatus.textContent = 'Please select a file.';
        return;
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const newFileName = `${userName}_${timestamp}_${file.name}`;

    const storageRef = storage.ref(`uploads/${newFileName}`);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadStatus.textContent = `Upload is ${progress}% done`;
        },
        (error) => {
            console.error('Upload error:', error);
            uploadStatus.textContent = 'Upload failed.';
        },
        () => {
            uploadStatus.textContent = 'Upload complete.';
        }
    );
});