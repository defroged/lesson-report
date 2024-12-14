// Get references to buttons and form elements
const teacherSelect = document.getElementById('teacherSelect');
const next1 = document.getElementById('next1');

const classSelect = document.getElementById('classSelect');
const next2 = document.getElementById('next2');

const classPictures = document.getElementById('classPictures');
const next3 = document.getElementById('next3');

const lessonContents = document.getElementById('lessonContents');
const next4 = document.getElementById('next4');

const submitBtn = document.getElementById('submitBtn');

// Steps
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const step5 = document.getElementById('step5');

// Enable "Next" button on Step 1 when a teacher is selected
teacherSelect.addEventListener('change', () => {
  next1.disabled = teacherSelect.value === '';
});

// On clicking next1, show step 2
next1.addEventListener('click', () => {
  step1.style.display = 'none';
  step2.style.display = 'block';
});

// Enable "Next" button on Step 2 when a class is selected
classSelect.addEventListener('change', () => {
  next2.disabled = classSelect.value === '';
});

// On clicking next2, show step 3
next2.addEventListener('click', () => {
  step2.style.display = 'none';
  step3.style.display = 'block';
});

// Enable "Next" button on Step 3 when at least one file is chosen
classPictures.addEventListener('change', () => {
  next3.disabled = classPictures.files.length === 0;
});

// On clicking next3, show step 4
next3.addEventListener('click', () => {
  step3.style.display = 'none';
  step4.style.display = 'block';
});

// Enable "Next" button on Step 4 when at least one file is chosen
lessonContents.addEventListener('change', () => {
  next4.disabled = lessonContents.files.length === 0;
});

// On clicking next4, show step 5
next4.addEventListener('click', () => {
  step4.style.display = 'none';
  step5.style.display = 'block';
});

// On clicking submitBtn, for now just log the data (placeholder)
submitBtn.addEventListener('click', () => {
  // Placeholder for your submit logic
  // Here you could gather the teacher name, class name, file references, etc.
  console.log('Submit clicked');
  alert('Data submitted (placeholder)');
});
