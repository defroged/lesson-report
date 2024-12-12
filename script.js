const passwordModal = document.getElementById('passwordModal');
    const timeline = document.getElementById('timeline');
    const classHeading = document.getElementById('classHeading');

    // Show the password modal when the page loads
    window.onload = () => {
        passwordModal.style.display = 'flex';
    };

    async function fetchData(password) {
        // Placeholder for fetching data from Google Sheets (replace with actual implementation)
        // Simulating an API call
        return new Promise((resolve) => {
            const mockData = [
                { password: "1234", className: "Math 101" },
                { password: "5678", className: "Science 202" },
                { password: "9101", className: "History 303" },
            ];

            const result = mockData.find(row => row.password === password);
            resolve(result ? result.className : null);
        });
    }

    async function checkPassword() {
        const passwordInput = document.getElementById('passwordInput').value;

        if (!passwordInput) {
            alert('Please enter your password.');
            return;
        }

        const className = await fetchData(passwordInput);

        if (className) {
            passwordModal.style.display = 'none';
            classHeading.textContent = className;
            timeline.style.display = 'block';
        } else {
            alert('Invalid password. Please try again.');
        }
    }