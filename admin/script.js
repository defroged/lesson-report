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

// Function to display a file item with a play button and delete button
function displayFile(itemRef, url) {
    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');

    // Extract name and date from filename
    const fileNameParts = itemRef.name.split('_');
    const userName = fileNameParts[0];
    const timestamp = fileNameParts.slice(1, -1).join('-');

    // Create elements for name and date
    const nameElement = document.createElement('p');
    nameElement.classList.add('file-name');
    nameElement.textContent = userName;

    const dateElement = document.createElement('p');
    dateElement.classList.add('file-date');
    dateElement.textContent = `(${timestamp})`;

    // Add name and date to the file item
    fileItem.appendChild(nameElement);
    fileItem.appendChild(dateElement);

    // Create a play button
    const playButton = document.createElement('div');
    playButton.classList.add('play-button');
    playButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M8 5v14l11-7z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
        </svg>
    `;

    // Add click event to the play button to trigger download
    playButton.addEventListener('click', () => {
        window.location.href = url; // Redirect to the file URL for download
    });

    // Add play button to the file item
    fileItem.appendChild(playButton);

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