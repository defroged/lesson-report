// teacherMainScript.js 

// Your provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTdo6AfCDj3yVCnndBCIOrLRm7oOaDFW8",
  authDomain: "bs-class-database.firebaseapp.com",
  projectId: "bs-class-database",
  storageBucket: "bs-class-database.firebasestorage.app", // Check correctness
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
const classPictures = document.getElementById('classPictures');
const lessonContents = document.getElementById('lessonContents');
const submitBtn = document.getElementById('submitBtn');

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
    step1.style.display = 'none';
    step2.style.display = 'block';
  }
});

// When a class is selected, show step 3
classSelect.addEventListener('change', async () => {
  if (classSelect.value !== '') {
    step2.style.display = 'none';

    // Fetch the events for the selected class
    await populateClassEvents(classSelect.value);

    step3.style.display = 'block';
  }
});

// When class pictures are selected, show step 4
classPictures.addEventListener('change', () => {
  if (classPictures.files.length > 0) {
    step3.style.display = 'none';
    step4.style.display = 'block';
  }
});

// When lesson contents are selected, show step 5
lessonContents.addEventListener('change', () => {
  if (lessonContents.files.length > 0) {
    step4.style.display = 'none';
    step5.style.display = 'block';
  }
});

// On clicking submit
const homeworkURLInput = document.getElementById('homeworkURLInput');

// On clicking submit
submitBtn.addEventListener('click', async () => {
  try {
    const classEventsSelect = document.getElementById('classEventsSelect');
    const selectedEventValue = classEventsSelect.value; 
    const selectedTeacher = teacherSelect.value;
    const selectedClass = classSelect.value;
    const homeworkURL = homeworkURLInput.value.trim();

    if (!selectedEventValue || !selectedClass) {
      alert("Please select an event and class.");
      return;
    }

    // Parse className and date
    const parts = selectedEventValue.trim().split(' ');
    const dateStr = parts[parts.length - 1]; 
    const className = parts.slice(0, parts.length - 1).join(' '); 

    // Convert YYYY-MM-DD to Timestamp
    const [year, month, day] = dateStr.split('-').map(Number);
    const classDate = new Date(year, month - 1, day);
    const timestamp = firebase.firestore.Timestamp.fromDate(classDate);

    // Upload class pictures
    const pictureFiles = classPictures.files;
    const uploadedPictureURLs = [];
    for (let i = 0; i < pictureFiles.length; i++) {
      const file = pictureFiles[i];
      const fileRef = storage.ref(`classPictures/${className}/${dateStr}/${file.name}`);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();
      uploadedPictureURLs.push(url);
    }

    // Upload lessonContents directly to Cloudinary
    const lessonFiles = lessonContents.files;
    const lessonContentURLs = [];

    const cloudName = "dzo0vucxp"; 
    const uploadPreset = "pxqxa22g"; 

    for (let i = 0; i < lessonFiles.length; i++) {
      const file = lessonFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('Error uploading to Cloudinary:', await response.text());
        alert('Error uploading lesson content image.');
        return;
      }

      const data = await response.json();
      // data.secure_url is the publicly accessible URL for the image
      lessonContentURLs.push(data.secure_url);
    }

    // Create the lesson report document without processedData first
    const docRef = db.collection('classes')
                     .doc(className)
                     .collection('lessonReports')
                     .doc(dateStr);

    await docRef.set({
      date: timestamp,
      classPictures: uploadedPictureURLs,
      homeworkURL: homeworkURL,
      processedData: {
        activities: [],
        grammar: [],
        phrasesAndSentences: [],
        vocabulary: []
      }
    }, { merge: true });

    // Now call the serverless function to get processedData from the lessonContents images
    const response = await fetch('/api/extractLessonDataFromImages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrls: lessonContentURLs })
    });

    if (!response.ok) {
      console.error('Error extracting data:', await response.text());
      alert('Error extracting data from images.');
      return;
    }

    const { processedData } = await response.json();

    // Update the Firestore document with processedData
    await docRef.update({ processedData });

    alert('Lesson Report submitted and processedData extracted successfully!');
  } catch (error) {
    console.error('Error submitting data:', error);
    alert('Error submitting data. Check console for details.');
  }
});

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
  } catch (error) {
    console.error('Error fetching class events:', error);
  }
}
