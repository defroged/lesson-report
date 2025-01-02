const firebaseConfig = {
    apiKey: "AIzaSyCTdo6AfCDj3yVCnndBCIOrLRm7oOaDFW8",
    authDomain: "bs-class-database.firebaseapp.com",
    projectId: "bs-class-database",
    storageBucket: "bs-class-database.firebasestorage.app", // Confirmed correct
    messagingSenderId: "577863988524",
    appId: "1:577863988524:web:dc28f58ed0350419d62889"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

const passwordContainer = document.getElementById('password-container');
const mainContainer = document.getElementById('main-container');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const loginMessage = document.getElementById('login-message');
const fileList = document.getElementById('file-list');

const correctPassword = "blues"; // Set the correct password

// Check password on login button click
loginButton.addEventListener('click', () => {
    const enteredPassword = passwordInput.value;
    if (enteredPassword === correctPassword) {
        passwordContainer.style.display = 'none';
        mainContainer.style.display = 'block';
        listFiles(); // Load files after successful login
    } else {
        loginMessage.textContent = "Incorrect password. Please try again.";
    }
});

// Function to list files in the Ondoku folder
function listFiles() {
    const storageRef = storage.ref();
    const ondokuRef = storageRef.child('Ondoku'); // Reference to the Ondoku folder

    ondokuRef.listAll()
        .then((res) => {
            fileList.innerHTML = ''; // Clear the file list

            res.items.forEach((itemRef) => {
                // Get the download URL for each file
                itemRef.getDownloadURL()
                    .then((url) => {
                        displayFile(itemRef, url);
                    })
                    .catch((error) => {
                        console.error("Error getting download URL:", error);
                    });
            });
        })
        .catch((error) => {
            console.error("Error listing files:", error);
        });
}

// Function to display a file item with preview and delete button
function displayFile(itemRef, url) {
    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');

    const fileName = document.createElement('p');
    fileName.textContent = itemRef.name;
    fileItem.appendChild(fileName);

    // Create media element based on file type
    let mediaElement;
    if (itemRef.name.endsWith('.mp4') || itemRef.name.endsWith('.webm')) {
        mediaElement = document.createElement('video');
        mediaElement.controls = true;
    } else if (itemRef.name.endsWith('.mp3') || itemRef.name.endsWith('.wav')) {
        mediaElement = document.createElement('audio');
        mediaElement.controls = true;
    }

    if (mediaElement) {
        mediaElement.src = url;
        fileItem.appendChild(mediaElement);
    }

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        deleteFile(itemRef, fileItem);
    });
    fileItem.appendChild(deleteButton);

    fileList.appendChild(fileItem);
}

// Function to delete a file
function deleteFile(itemRef, fileItem) {
    if (confirm(`Are you sure you want to delete ${itemRef.name}?`)) {
        itemRef.delete()
            .then(() => {
                console.log("File deleted successfully:", itemRef.name);
                fileList.removeChild(fileItem); // Remove from the display
            })
            .catch((error) => {
                console.error("Error deleting file:", error);
            });
    }
}