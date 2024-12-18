// script.js



window.onload = () => {
    const passwordModal = document.getElementById('passwordModal');
    passwordModal.style.display = 'flex'; // Ensure modal is visible
};

function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');

    // Customize styles based on type (error, success, info)
    if (type === 'error') {
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
        notification.style.borderColor = '#f5c6cb';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#d4edda';
        notification.style.color = '#155724';
        notification.style.borderColor = '#c3e6cb';
    } else if (type === 'info') {
        notification.style.backgroundColor = '#d1ecf1';
        notification.style.color = '#0c5460';
        notification.style.borderColor = '#bee5eb';
    }

    notification.textContent = message;
    notification.style.display = 'block';

    // Hide the notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

async function fetchData(password) {
    try {
        const response = await fetch(`/api/fetchData?password=${encodeURIComponent(password)}`);
        
        if (!response.ok) {
            let errorMessage = 'Failed to fetch data.';
            const clonedResponse = response.clone();
            try {
                const errorData = await clonedResponse.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                const errorText = await clonedResponse.text();
                console.error('Non-JSON error response:', errorText);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.className;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function fetchLessonReports(className, page = 1, limit = 10) { //change 10 to any number for event limit
    try {
        const response = await fetch(`/api/getLessonReports?className=${encodeURIComponent(className)}&page=${page}&limit=${limit}`);
        
        if (!response.ok) {
            let errorMessage = 'Failed to fetch lesson reports.';
            const clonedResponse = response.clone();
            try {
                const errorData = await clonedResponse.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                const errorText = await clonedResponse.text();
                console.error('Non-JSON error response:', errorText);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.lessonReports;
    } catch (error) {
        console.error('Error fetching lesson reports:', error);
        return [];
    }
}

function createTimelineItem(report) {
    const timelineItem = document.createElement('div');
    timelineItem.classList.add('timeline-item');

    const timelineDate = document.createElement('div');
    timelineDate.classList.add('timeline-date');
    timelineDate.textContent = report.date;
    timelineItem.appendChild(timelineDate);

    const timelineContent = document.createElement('div');
    timelineContent.classList.add('timeline-content');

    const postTitle = document.createElement('h2');
    postTitle.classList.add('post-title');
    postTitle.textContent = `Lesson Report ${report.id}`;
    timelineContent.appendChild(postTitle);

    if (report.classPictures && report.classPictures.length > 0) {
    const gallery = document.createElement('div');
    gallery.classList.add('timeline-gallery');

    report.classPictures.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        // Add a click event to open the modal
        img.addEventListener('click', () => openImageModal(url));
        gallery.appendChild(img);
    });

    timelineContent.appendChild(gallery);
}


    const postedBy = document.createElement('p');
    postedBy.classList.add('posted-by');
    postedBy.textContent = `Posted by ${report.processedData.teacher || 'Unknown'}`;
    timelineContent.appendChild(postedBy);

    if (report.homeworkURL) {
        const homeworkLink = document.createElement('a');
        homeworkLink.href = report.homeworkURL;
        homeworkLink.textContent = '今日の宿題';
        homeworkLink.target = '_blank';
        timelineContent.appendChild(homeworkLink);
    }

    // Add processed data
    const processedData = report.processedData;
    function appendSection(timelineContent, title, items, className) {
    const container = document.createElement('p');
    
    const label = document.createElement('span');
    label.classList.add(className);
    label.textContent = title + ': ';
    
    const text = document.createTextNode(items.join(', '));
    
    container.appendChild(label);
    container.appendChild(text);
    timelineContent.appendChild(container);
}

if (processedData.activities) {
    appendSection(timelineContent, 'アクティビティ', processedData.activities, 'activities-label');
}
if (processedData.grammar) {
    appendSection(timelineContent, '文法', processedData.grammar, 'grammar-label');
}
if (processedData.phrasesAndSentences) {
    appendSection(timelineContent, 'フレーズ＆文', processedData.phrasesAndSentences, 'phrases-label');
}
if (processedData.vocabulary) {
    appendSection(timelineContent, 'ことば', processedData.vocabulary, 'vocabulary-label');
}

    timelineItem.appendChild(timelineContent);
    return timelineItem;
}

async function loadLessonReports(className, page) {
    const timeline = document.getElementById('timeline');
    const lessonReports = await fetchLessonReports(className, page);

    if (lessonReports.length === 0) {
        showNotification('No more lesson reports to load.', 'info');
document.getElementById('load-more').style.display = 'none';

        return;
    }

    lessonReports.reverse().forEach(report => {
    const timelineItem = createTimelineItem(report);
    timeline.prepend(timelineItem);
});
}

async function checkPassword() {
    const passwordInput = document.getElementById('passwordInput').value;

    if (!passwordInput) {
    showNotification('４桁のID番号を入力してください。', 'error');
    return;
}
    }

    const className = await fetchData(passwordInput);

if (className) {
    document.getElementById('passwordModal').style.display = 'none';

    // Show loading animation
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';

    document.getElementById('classHeading').textContent = `${className} - Lesson Report`;

    // Initialize load more button data
    const loadMoreBtn = document.getElementById('load-more');
    loadMoreBtn.setAttribute('data-page', '1');
    loadMoreBtn.setAttribute('data-class', className);

    // Load the first page of lesson reports
    await loadLessonReports(className, 1);

    // Hide loading animation and display timeline
    loading.style.display = 'none';
    document.getElementById('timeline').style.display = 'block';

    // Show the load more button
    const loadMoreContainer = document.getElementById('load-more-container');
    loadMoreContainer.style.display = 'flex';
} else {
    showNotification('無効なパスワードです。もう一度入力してください。', 'error');
}

}

// Ensure you have a button with id 'submitPasswordButton' to trigger password check
document.getElementById('submitPasswordButton').addEventListener('click', checkPassword);

// Load more functionality
document.addEventListener("DOMContentLoaded", function() {
    const loadMoreBtn = document.getElementById("load-more");
    loadMoreBtn.addEventListener("click", function() {
        const currentPage = parseInt(loadMoreBtn.getAttribute("data-page"));
        const className = loadMoreBtn.getAttribute('data-class');

        const nextPage = currentPage + 1;
        loadLessonReports(className, nextPage);
        loadMoreBtn.setAttribute("data-page", nextPage.toString());
    });
});

function openImageModal(imageUrl) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    modalImg.src = imageUrl;
    modal.style.display = 'flex';
}

// Close the modal when clicking on the close button or outside the image
document.addEventListener('click', function (event) {
    const modal = document.getElementById('imageModal');
    if (event.target.classList.contains('image-modal') || 
        event.target.classList.contains('image-modal-close')) {
        modal.style.display = 'none';
    }
});

