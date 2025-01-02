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
    console.log("displayFile called for:", itemRef.name, "URL:", url); // Log at the start

    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');

    const fileName = document.createElement('p');
    fileName.textContent = itemRef.name;
    fileItem.appendChild(fileName);

    // Check if we are dealing with a video file
    if (itemRef.name.endsWith('.mp4') || itemRef.name.endsWith('.webm')) {
        console.log("Creating video element for:", itemRef.name); // Log before video creation

        let mediaElement = document.createElement('video');
        mediaElement.controls = true;
        mediaElement.preload = 'metadata'; // Or 'auto'

        console.log("Setting video source URL:", url); // Log before setting src

        mediaElement.src = url;

        // Error checking after setting src
        if (!mediaElement.src) {
            console.error("Failed to set video src for:", itemRef.name);
            return; // Exit early if src is not set
        }

        // Append video to fileItem
        console.log("Appending video element to fileItem"); // Log before append
        fileItem.appendChild(mediaElement);

    } else if (itemRef.name.endsWith('.mp3') || itemRef.name.endsWith('.wav')) {
        // Handle audio files (this part seems to be working)
        let mediaElement = document.createElement('audio');
        mediaElement.controls = true;
        mediaElement.src = url;
        fileItem.appendChild(mediaElement);
    } else {
        console.log("Skipping non-media file:", itemRef.name); // Log for other file types
    }

    // Delete button (no changes needed here)
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        deleteFile(itemRef, fileItem);
    });
    fileItem.appendChild(deleteButton);

    console.log("Appending fileItem to fileList"); // Log before appending fileItem
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