window.onload = () => {
    const passwordModal = document.getElementById('passwordModal');
    passwordModal.style.display = 'flex'; // Ensure modal is visible
};

async function fetchData(password) {
    try {
        const response = await fetch(`/api/fetchData?password=${encodeURIComponent(password)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data.');
        }

        const data = await response.json();
        return data.className;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function checkPassword() {
    const passwordInput = document.getElementById('passwordInput').value;

    if (!passwordInput) {
        alert('Please enter your password.');
        return;
    }

    const className = await fetchData(passwordInput);

    if (className) {
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('classHeading').textContent = className;
        document.getElementById('timeline').style.display = 'block';
    } else {
        alert('Invalid password. Please try again.');
    }
}

// Ensure you have a button with id 'submitPasswordButton' to trigger password check
document.getElementById('submitPasswordButton').addEventListener('click', checkPassword);
