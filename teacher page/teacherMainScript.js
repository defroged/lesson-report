// teacherMainScript.js 

// Your provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTdo6AfCDj3yVCnndBCIOrLRm7oOaDFW8",
  authDomain: "bs-class-database.firebaseapp.com",
  projectId: "bs-class-database",
  storageBucket: "bs-class-database.firebasestorage.app",
  messagingSenderId: "577863988524",
  appId: "1:577863988524:web:dc28f58ed0350419d62889"
};

// Initialize Firebase app
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// References to elements
const teacherSelect = document.getElementById('teacherSelect');
const classSelect = document.getElementById('classSelect');
// Note: We renamed these IDs in HTML to '...Input'
const classPicturesInput = document.getElementById('classPicturesInput');
const lessonContentsInput = document.getElementById('lessonContentsInput');
const submitBtn = document.getElementById('submitBtn');
const homeworkURLInput = document.getElementById('homeworkURLInput'); 
const audioURLInput = document.getElementById('audioURLInput'); 

// Global arrays to store accumulated files
let allClassPictures = [];
let allLessonContents = [];

// Steps
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const step5 = document.getElementById('step5');

// On page load, populate classes
document.addEventListener('DOMContentLoaded', async () => {
  await populateClasses();
});

// When a teacher is selected, show step 2
teacherSelect.addEventListener('change', () => {
  if (teacherSelect.value !== '') {
    step1.classList.remove('active');
    step2.classList.add('active');
  }
});

// When a class is selected, show step 3
classSelect.addEventListener('change', async () => {
  if (classSelect.value !== '') {
    step2.classList.remove('active');

    // Fetch the events for the selected class
    await populateClassEvents(classSelect.value);

    step3.classList.add('active');
  }
});

// Helper function to handle file accumulation and preview
function handleFileSelect(event, fileArray, previewContainerId) {
  const files = Array.from(event.target.files);
  const previewContainer = document.getElementById(previewContainerId);
  
  files.forEach(file => {
    // Add to our global array
    fileArray.push(file);

    // Create a thumbnail
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    img.style.border = '1px solid #ccc';
    previewContainer.appendChild(img);
  });

  // Clear the input so the same file can be selected again if needed, 
  // or to prepare for the next photo snap
  event.target.value = ''; 
}

// Event Listeners for file inputs
classPicturesInput.addEventListener('change', (e) => {
  handleFileSelect(e, allClassPictures, 'classPicturesPreview');
  // We do NOT auto-advance anymore, user must click Next
});

lessonContentsInput.addEventListener('change', (e) => {
  handleFileSelect(e, allLessonContents, 'lessonContentsPreview');
});

// On clicking submit
submitBtn.addEventListener('click', async () => {
  const loadingOverlay = document.getElementById('loadingOverlay');

  try {
    const classEventsSelect = document.getElementById('classEventsSelect');
    const selectedEventValue = classEventsSelect.value;
    const selectedTeacher = teacherSelect.value;
    const selectedClass = classSelect.value;
    const homeworkURL = homeworkURLInput.value.trim();
    const audioURL = audioURLInput.value.trim();

    // 1. Basic Validation using SweetAlert
    if (!selectedEventValue || !selectedClass) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select both an event and a class.'
      });
      return;
    }

    // Show loading overlay
    loadingOverlay.style.display = 'flex';

    // Parse className and date
    const parts = selectedEventValue.trim().split(' ');
    const dateStr = parts[parts.length - 1];
    const className = parts.slice(0, parts.length - 1).join(' ');

    // Convert YYYY-MM-DD to Timestamp
    const [year, month, day] = dateStr.split('-').map(Number);
    const classDate = new Date(year, month - 1, day);
    // Set to noon to avoid timezone shifting
    classDate.setHours(12, 0, 0, 0);
    const timestamp = firebase.firestore.Timestamp.fromDate(classDate);

    // 2. Upload Class Pictures
    const uploadedPictureURLs = [];
    for (let i = 0; i < allClassPictures.length; i++) {
      const file = allClassPictures[i];
      const uniqueName = Date.now() + '_' + file.name;
      const fileRef = storage.ref(`classPictures/${className}/${dateStr}/${uniqueName}`);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();
      uploadedPictureURLs.push(url);
    }

    // 3. Upload Lesson Contents to Cloudinary
    const lessonContentURLs = [];
    const cloudName = "dzo0vucxp";
    const uploadPreset = "pxqxa22g";

    for (let i = 0; i < allLessonContents.length; i++) {
      const file = allLessonContents[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloudinary Upload Failed: ${errText}`);
      }

      const data = await response.json();
      lessonContentURLs.push(data.secure_url);
    }

    // 4. Create Firestore Document
    const docRef = db.collection('classes')
      .doc(className)
      .collection('lessonReports')
      .doc(dateStr);

    await docRef.set({
      date: timestamp,
      classPictures: uploadedPictureURLs,
      homeworkURL: homeworkURL,
      audioURL: audioURL,
      processedData: {
        activities: [],
        grammar: [],
        phrasesAndSentences: [],
        vocabulary: [],
        hidden: []
      }
    }, { merge: true });

    // 5. AI Extraction
    const response = await fetch('/api/extractLessonDataFromImages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrls: lessonContentURLs })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Data Extraction Failed: ${errText}`);
    }

    const { processedData, hidden } = await response.json();
    processedData.teacher = selectedTeacher;
    processedData.hidden = hidden || [];

    await docRef.update({ processedData });

    // 6. Success Handling with Timer and Refresh
    loadingOverlay.style.display = 'none'; // Hide loading before success alert
    
    await Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Lesson Report submitted successfully. Refreshing page...',
      timer: 3000, // 3 seconds
      timerProgressBar: true,
      willClose: () => {
        window.location.reload();
      }
    });

  } catch (error) {
    console.error('Error submitting data:', error);
    loadingOverlay.style.display = 'none'; // Ensure overlay is hidden on error
    
    // Detailed Error Alert
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: error.message || 'An unexpected error occurred. Please try again.'
    });
  }
});

// Back button elements
const backToStep1 = document.getElementById('backToStep1');
const backToStep2 = document.getElementById('backToStep2');
const backToStep3 = document.getElementById('backToStep3');
const backToStep4 = document.getElementById('backToStep4');

// Back button event listeners
if (backToStep1) {
  backToStep1.addEventListener('click', () => {
    step2.classList.remove('active');
    step1.classList.add('active');
  });
}

if (backToStep2) {
  backToStep2.addEventListener('click', () => {
    step3.classList.remove('active');
    step2.classList.add('active');
  });
}

if (backToStep3) {
  backToStep3.addEventListener('click', () => {
    step4.classList.remove('active');
    step3.classList.add('active');
  });
}

if (backToStep4) {
  backToStep4.addEventListener('click', () => {
    step5.classList.remove('active');
    step4.classList.add('active');
  });
}

// Next button event listeners
const nextFromStep1 = document.getElementById('nextFromStep1');
if (nextFromStep1) {
  nextFromStep1.addEventListener('click', () => {
    if (teacherSelect.value !== '') {
      step1.classList.remove('active');
      step2.classList.add('active');
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Step 1 Incomplete',
        text: 'Please select a teacher.'
      });
    }
  });
}

const nextFromStep2 = document.getElementById('nextFromStep2');
if (nextFromStep2) {
  nextFromStep2.addEventListener('click', () => {
    if (classSelect.value !== '') {
      step2.classList.remove('active');
      step3.classList.add('active');
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Step 2 Incomplete',
        text: 'Please select a class.'
      });
    }
  });
}

const nextFromStep3 = document.getElementById('nextFromStep3');
if (nextFromStep3) {
  nextFromStep3.addEventListener('click', () => {
    const classEventsSelect = document.getElementById('classEventsSelect');
    if (classEventsSelect.value !== '') {
      step3.classList.remove('active');
      step4.classList.add('active');
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Step 3 Incomplete',
        text: 'Please select an event.'
      });
    }
  });
}

const nextFromStep4 = document.getElementById('nextFromStep4');
if (nextFromStep4) {
  nextFromStep4.addEventListener('click', () => {
    // Check our array instead of the input.files
    if (allLessonContents.length > 0) {
      step4.classList.remove('active');
      step5.classList.add('active');
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Step 4 Incomplete',
        text: 'Please upload at least one lesson content image.'
      });
    }
  });
}



// Fetch classes from Firestore via the serverless endpoint
async function populateClasses() {
  try {
    const response = await fetch('/api/getClasses');
    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }
    const data = await response.json();
    const classes = data.classes || [];

    // Populate the classSelect dropdown
    classes.forEach(className => {
      const option = document.createElement('option');
      option.value = className;
      option.textContent = className;
      classSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
  }
}

async function populateClassEvents(selectedClass) {
  const classEventsSelect = document.getElementById('classEventsSelect');
  
  // Clear existing options (except the first)
  while (classEventsSelect.options.length > 1) {
    classEventsSelect.remove(1);
  }

  try {
    const now = new Date();
    const timeMax = now.toISOString();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days back

    const response = await fetch(`/api/getClassEvents?className=${encodeURIComponent(selectedClass)}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch class events');
    }
    const data = await response.json();
    const events = data.events || [];

    events.forEach(evt => {
      const option = document.createElement('option');
      // Format as "ClassName YYYY-MM-DD"
      option.value = `${selectedClass} ${evt.date}`;
      option.textContent = `${selectedClass} ${evt.date}`;
      classEventsSelect.appendChild(option);
    });

    // Select the event date closest to today
    if (events.length > 0) {
      let closestIndex = 0;
      let closestDiff = Infinity;
      const today = new Date();
      events.forEach((evt, index) => {
        const [year, month, day] = evt.date.split('-').map(Number);
        const evtDate = new Date(year, month - 1, day);
        const diff = Math.abs(evtDate - today);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIndex = index;
        }
      });
      // +1 because the first option is the placeholder
      classEventsSelect.selectedIndex = closestIndex + 1;
    }
  } catch (error) {
    console.error('Error fetching class events:', error);
  }
}


