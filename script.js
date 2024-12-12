window.onload = () => {
    const passwordModal = document.getElementById('passwordModal');
    passwordModal.style.display = 'flex'; // Ensure modal is visible
};

async function fetchData(password) {
    const spreadsheetId = "1ax9LCCUn1sT6ogfZ4sv9Qj9Nx6tdAB-lQ3JYxdHIF7U";
    const apiKey = 'AIzaSyAGi58EWi-d5IrxvWkJuVY6ptplm93r4dU'; 
    const range = "Sheet1!A:M"; 
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values) {
            const rows = data.values.slice(1); // Skip the header row
            const match = rows.find(row => row[12] === password); // Column M (index 12)
            
            return match ? match[1] : null; // Column B (index 1) is the class name
        } else {
            console.error("No data found in the spreadsheet.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
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
