// homeworkHelper.js

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('homeworkImage');
    const getHelpButton = document.getElementById('getHelpButton');
    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    const copyUrlButton = document.getElementById('copyUrlButton'); // Added
    const errorMessageElement = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const fileNameDisplay = document.getElementById('fileName');

 let currentImageFiles = []; // Changed from currentImageFile = null
    let currentAudioUrl = null;

    imageInput.addEventListener('change', (event) => {
        currentImageFiles = Array.from(event.target.files); // Store all selected files
        if (currentImageFiles.length > 0) {
            fileNameDisplay.textContent = `選択したファイル: ${currentImageFiles.map(f => f.name).join(', ')}`;
            getHelpButton.disabled = false;
            clearError(); // Clear previous errors when new files are selected
        } else {
            fileNameDisplay.textContent = '';
            getHelpButton.disabled = true;
        }
    });

    getHelpButton.addEventListener('click', async () => {
        if (!currentImageFiles || currentImageFiles.length === 0) {
            displayError("まず、宿題の画像を一つ以上選んでね！");
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSizeInBytes = 10 * 1024 * 1024; // 10MB per file

        for (const file of currentImageFiles) {
            // Validate file type (client-side)
            if (!allowedTypes.includes(file.type)) {
                displayError(`"${file.name}" のファイル形式はだめみたい。選べるのは画像ファイル (JPEG, PNG, GIF, WEBP) だけだよ。`);
                resetFileInput(); // Consider if you want to reset all files or allow user to remove just the bad one
                return;
            }

            // Validate file size (client-side)
            if (file.size > maxSizeInBytes) {
                displayError(`"${file.name}" が大きすぎるみたい。${(maxSizeInBytes / (1024 * 1024)).toFixed(0)}MBまでの画像にしてね。`);
                resetFileInput();
                return;
            }
        }

        clearPreviousResults();
        showLoading(true);

        try {
            // Convert all selected images to base64 Data URIs
            const imagePromises = currentImageFiles.map(file => toBase64(file));
            const imageDataUris = await Promise.all(imagePromises);

            // Step 1: Send images to OpenAI Vision API
            const explanationResponse = await fetch('/api/openaiVision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: imageDataUris }), // Send an array of image data URIs
            });

            if (!explanationResponse.ok) {
                const errorData = await explanationResponse.json();
                throw new Error(errorData.error || `AI先生からの説明取得に失敗 (コード: ${explanationResponse.status})`);
            }
            const { explanation } = await explanationResponse.json();

            if (!explanation) {
                throw new Error("AI先生が説明文を作れなかったみたい。もう一度試してみてね。");
            }

           // Step 2: Send text to OpenAI TTS API
            const audioResponse = await fetch('/api/openaiTTS', { // Changed endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: explanation }),
            });

            if (!audioResponse.ok) {
                const errorData = await audioResponse.json();
                throw new Error(errorData.error || `音声の作成に失敗 (コード: ${audioResponse.status})`);
            }
            // Assuming OpenAI TTS will also return audioContent (base64) or audioUrl
            const { audioContent, audioUrl } = await audioResponse.json();

            if (audioUrl) {
                displayAudioUrl(audioUrl); // This function will now also handle showing the copy button
            } else if (audioContent) {
                // Ensure the audio format matches what OpenAI TTS provides, e.g., mp3
                displayAudioFromBase64(audioContent, 'audio/mpeg'); // This function will now also handle hiding the copy button
            } else {
                // If neither audioUrl nor audioContent is available, ensure the copy button is hidden.
                // This might also be handled by the catch block's displayError, but good to be explicit.
                if (copyUrlButton) copyUrlButton.style.display = 'none';
                currentAudioUrl = null;
                throw new Error("音声ファイルがうまく作れなかったみたい。もう一度試してみてね。");
            }

        } catch (error) {
            console.error('Processing Error:', error);
            displayError(`おっと、問題が発生したみたい: ${error.message}`);
        } finally {
            showLoading(false);
        }
    });

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result); // Send the full data URI
            reader.onerror = error => reject(error);
        });
    }

    function displayAudioUrl(url) {
        audioPlayerContainer.innerHTML = ''; // Clear previous audio element
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.src = url;
        audioPlayerContainer.appendChild(audioElement);
        audioElement.play().catch(e => console.warn("Audio autoplay prevented:", e));

        currentAudioUrl = url; // Store the URL for the copy button
        if (copyUrlButton) {
            copyUrlButton.textContent = 'URLをコピー'; // Reset button text
            copyUrlButton.style.display = 'block'; // Or 'inline-block' based on desired layout with CSS
            copyUrlButton.disabled = false; // Ensure button is enabled
        }
    }

        function displayAudioFromBase64(base64String, mimeType = 'audio/mp3') { // Added mimeType parameter with default
        audioPlayerContainer.innerHTML = ''; // Clear previous audio element
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.src = `data:${mimeType};base64,${base64String}`;
        audioPlayerContainer.appendChild(audioElement);
        audioElement.play().catch(e => console.warn("Audio autoplay prevented:", e));

        currentAudioUrl = null; // No URL to copy
        if (copyUrlButton) {
            copyUrlButton.style.display = 'none'; // Hide the copy button
        }
    }

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
        getHelpButton.disabled = isLoading || !currentImageFiles || currentImageFiles.length === 0;
        imageInput.disabled = isLoading;
    }

    function displayError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        audioPlayerContainer.innerHTML = ''; // Clear any previous audio

        currentAudioUrl = null; // Clear the stored URL
        if (copyUrlButton) {
            copyUrlButton.style.display = 'none'; // Hide the copy button
        }
    }

    function clearError() {
        errorMessageElement.textContent = '';
        errorMessageElement.style.display = 'none';
    }

    function clearPreviousResults() {
        audioPlayerContainer.innerHTML = '';
        clearError();
        currentAudioUrl = null; // Clear the stored URL
        if (copyUrlButton) {
            copyUrlButton.style.display = 'none'; // Hide the copy button
        }
    }

    function resetFileInput() {
        imageInput.value = ''; // Clear the selected files from the input element
        fileNameDisplay.textContent = '';
        currentImageFiles = []; // Clear the array of stored files
        getHelpButton.disabled = true;
    }
	
	    // Event listener for the new Copy URL button
    if (copyUrlButton) {
        copyUrlButton.addEventListener('click', async () => {
            if (copyUrlButton.disabled || !currentAudioUrl) {
                return; // Do nothing if button is disabled or no URL is set
            }

            try {
                await navigator.clipboard.writeText(currentAudioUrl);
                copyUrlButton.textContent = 'コピーしました！';
                copyUrlButton.disabled = true; // Briefly disable to prevent spamming
                setTimeout(() => {
                    copyUrlButton.textContent = 'URLをコピー';
                    copyUrlButton.disabled = false; // Re-enable
                }, 2000); // Revert text and enable after 2 seconds
            } catch (err) {
                console.error('URLのコピーに失敗:', err);
                copyUrlButton.textContent = 'コピー失敗';
                // Optionally, provide a more user-facing error message here
                setTimeout(() => {
                    copyUrlButton.textContent = 'URLをコピー';
                }, 2000);
            }
        });
    }
});