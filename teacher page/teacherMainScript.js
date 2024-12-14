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
submitBtn.addEventListener('click', () => {
  console.log('Selected Teacher:', teacherSelect.value);
  console.log('Selected Class:', classSelect.value);
  console.log('Class Pictures:', classPictures.files);
  console.log('Lesson Contents:', lessonContents.files);

  alert('Data submitted (placeholder)');
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
      option.value = evt.date;
      option.textContent = `${selectedClass} ${evt.date}`;
      classEventsSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching class events:', error);
  }
}

