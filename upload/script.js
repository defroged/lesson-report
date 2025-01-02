// Use the same Firebase configuration as your existing project
const firebaseConfig = {
    apiKey: "AIzaSyCTdo6AfCDj3yVCnndBCIOrLRm7oOaDFW8", // Your API Key
    authDomain: "bs-class-database.firebaseapp.com",
    projectId: "bs-class-database",
    storageBucket: "bs-class-database.firebasestorage.app",
    messagingSenderId: "577863988524",
    appId: "1:577863988524:web:dc28f58ed0350419d62889"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage(); // Get the storage object

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

    // Create a reference to the 'Ondoku' folder and the file
    const storageRef = storage.ref(`Ondoku/${newFileName}`);
    const uploadTask = storageRef.put(file);

    // Show the progress bar
    uploadStatus.style.display = 'flex';

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // Ensure the progress bar and text are updated
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');

            if (progressBar && progressText) {
                progressBar.value = progress;
                progressText.textContent = `${Math.round(progress)}%`;
            }
        },
        (error) => {
            console.error('アップロードエラー:', error);
            // Update the status in case of an error
            const uploadStatus = document.getElementById('uploadStatus');
            if (uploadStatus) {
                uploadStatus.textContent = 'アップロードに失敗しました。';
            }
        },
        () => {
            // Update the status when upload is complete
            const uploadStatus = document.getElementById('uploadStatus');
            if (uploadStatus) {
                uploadStatus.textContent = 'アップロード完了';
            }
        }
    );
});