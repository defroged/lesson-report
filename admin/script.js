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
    console.log("displayFile called for:", itemRef.name, "URL:", url);

    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');

    // Extract name and date from filename
    const fileNameParts = itemRef.name.split('_'); // Split by underscore
    const userName = fileNameParts[0];
    const timestamp = fileNameParts.slice(1, -1).join('-'); // Join all parts except the first and last with a dash
    
    // Supported video file extensions:
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];

    // Get the file extension (if any) and convert to lowercase
    const fileExtension = itemRef.name.lastIndexOf('.') > 0
        ? itemRef.name.substring(itemRef.name.lastIndexOf('.')).toLowerCase()
        : '';

    // Create elements for name and date
    const nameElement = document.createElement('p');
    nameElement.classList.add('file-name');
    nameElement.textContent = userName;
    nameElement.style.fontWeight = 'bold'; // Make name bold

    const dateElement = document.createElement('p');
    dateElement.classList.add('file-date');
    dateElement.textContent = `(${timestamp})`; // Add brackets around the date

    // Add name and date to the file item
    fileItem.appendChild(nameElement);
    fileItem.appendChild(dateElement);

    // Check if the file should be treated as a video
    if (videoExtensions.includes(fileExtension) || fileExtension === '') {
        console.log("Creating video element for:", itemRef.name);

        let mediaElement = document.createElement('video');
        mediaElement.controls = true;
        mediaElement.preload = 'metadata'; // Or 'auto'

        console.log("Setting video source URL:", url);

        mediaElement.src = url;

        if (!mediaElement.src) {
            console.error("Failed to set video src for:", itemRef.name);
            return;
        }

        console.log("Appending video element to fileItem");
        fileItem.appendChild(mediaElement);

    } else if (fileExtension === '.mp3' || fileExtension === '.wav') {
        // Handle audio files
        let mediaElement = document.createElement('audio');
        mediaElement.controls = true;
        mediaElement.src = url;
        fileItem.appendChild(mediaElement);
    } else {
        console.log("Skipping non-media file:", itemRef.name);
    }

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        deleteFile(itemRef, fileItem);
    });
    fileItem.appendChild(deleteButton);

    console.log("Appending fileItem to fileList");
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