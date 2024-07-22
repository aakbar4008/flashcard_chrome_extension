document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const links = ['link1', 'link2', 'link3', 'link4'];
    const linkPopup = document.getElementById('link-popup');
    const linkUrlInput = document.getElementById('link-url');
    const linkNameInput = document.getElementById('link-name');
    const linkColorInput = document.getElementById('link-color');
    const saveLinkButton = document.getElementById('save-link');
    const resetLinkButton = document.getElementById('reset-link');
    const cancelLinkButton = document.getElementById('cancel-link');
    const flashcardContent = document.getElementById('flashcard-content');
    const flagIcon = document.getElementById('flag-icon');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const allCardsRadio = document.getElementById('all-cards');
    const flaggedCardsRadio = document.getElementById('flagged-cards');
    const flashcardCounter = document.getElementById('flashcard-counter');
    const toggleSidebarButton = document.getElementById('toggle-sidebar');
    const collapseButton = document.getElementById('collapse-button');
    const fileInput = document.getElementById('file-input');
    const setList = document.getElementById('set-list');
    const setEditPopup = document.getElementById('set-edit-popup');
    const setEditTitle = document.getElementById('set-edit-title');
    const setEditSaveButton = document.getElementById('set-edit-save');
    const setEditDeleteButton = document.getElementById('set-edit-delete');
    const setEditCancelButton = document.getElementById('set-edit-cancel');
    const flashcardEditPopup = document.getElementById('flashcard-edit-popup');
    const flashcardEditTerm = document.getElementById('flashcard-edit-term');
    const flashcardEditDefinition = document.getElementById('flashcard-edit-definition');
    const flashcardEditSaveButton = document.getElementById('flashcard-edit-save');
    const flashcardEditDeleteButton = document.getElementById('flashcard-edit-delete');
    const flashcardEditCancelButton = document.getElementById('flashcard-edit-cancel');
    const manualAddPopup = document.getElementById('manual-add-popup');
    const manualSetTitle = document.getElementById('manual-set-title');
    const manualAddTerm = document.getElementById('manual-add-term');
    const manualAddDefinition = document.getElementById('manual-add-definition');
    const manualAddSaveButton = document.getElementById('manual-add-save');
    const manualAddCancelButton = document.getElementById('manual-add-cancel');
  
    let currentLinkElement;
    let showingFront = true;
    let currentFlashcardIndex = 0;
    let currentSetIndex = 0;
    let flashcardSets = [];
  
    chrome.storage.sync.get('flashcardSets', (data) => {
      flashcardSets = data.flashcardSets || [];
      if (flashcardSets.length === 0) {
        flashcardSets.push({
          title: 'Default Set',
          flashcards: [
            { front: "What is the capital of France?", back: "Paris", flagged: false },
            { front: "What is 2 + 2?", back: "4", flagged: false }
          ]
        });
      }
      renderSetList();
      showFlashcard();
    });
  
    function saveFlashcardSets() {
      chrome.storage.sync.set({ flashcardSets });
    }
  
    function isValidUrl(string) {
      try {
        new URL(string);
        return true;
      } catch (err) {
        return false;
      }
    }
  
    searchForm.addEventListener('submit', (event) => {
      if (searchInput.value.trim() === '') {
        event.preventDefault();
      }
    });
  
    links.forEach(linkId => {
      const link = document.getElementById(linkId);
      setupLink(link);
    });
  
    function setupLink(link) {
      chrome.storage.sync.get([link.id, `${link.id}-name`, `${link.id}-color`], (data) => {
        if (data[link.id]) {
          link.href = data[link.id];
          link.textContent = data[`${link.id}-name`] || "Right click me!";
          link.style.backgroundColor = data[`${link.id}-color`] || '#f7f9fa';
          link.target = '_blank';
        } else {
          link.href = '#';
          link.textContent = "Right click me!";
        }
        link.addEventListener('contextmenu', handleLinkContextMenu);
      });
    }
  
    function handleLinkContextMenu(event) {
      event.preventDefault();
      currentLinkElement = event.target;
      linkUrlInput.value = currentLinkElement.href !== '#' ? currentLinkElement.href.replace('https://', '') : '';
      linkNameInput.value = currentLinkElement.textContent === "Right click me!" ? '' : currentLinkElement.textContent;
      linkColorInput.value = currentLinkElement.style.backgroundColor || '#f7f9fa';
      linkPopup.style.display = 'block';
    }
  
    document.addEventListener('click', (event) => {
      if (linkPopup.style.display === 'block' && !linkPopup.contains(event.target) && event.target !== currentLinkElement) {
        linkPopup.style.display = 'none';
      }
    });
  
    saveLinkButton.addEventListener('click', () => {
      let newUrl = linkUrlInput.value.trim();
      const newName = linkNameInput.value.trim();
      const newColor = linkColorInput.value;
  
      if (newUrl) {
        if (!/^https?:\/\//.test(newUrl)) {
          newUrl = `https://${newUrl}`;
        }
        if (isValidUrl(newUrl)) {
          const currentLinkId = currentLinkElement.id;
          chrome.storage.sync.set({
            [currentLinkId]: newUrl,
            [`${currentLinkId}-name`]: newName,
            [`${currentLinkId}-color`]: newColor
          }, () => {
            currentLinkElement.href = newUrl;
            currentLinkElement.textContent = newName || "Right click me!";
            currentLinkElement.style.backgroundColor = newColor;
            currentLinkElement.target = '_blank';
            linkPopup.style.display = 'none';
          });
        } else {
          alert('Invalid URL. Please enter a valid URL.');
        }
      }
    });
  
    resetLinkButton.addEventListener('click', () => {
      const linkId = currentLinkElement.id;
      chrome.storage.sync.remove([linkId, `${linkId}-name`, `${linkId}-color`], () => {
        currentLinkElement.href = '#';
        currentLinkElement.textContent = "Right click me!";
        currentLinkElement.style.backgroundColor = '';
        linkPopup.style.display = 'none';
      });
    });
  
    cancelLinkButton.addEventListener('click', () => {
      linkPopup.style.display = 'none';
    });
  
    function getCurrentFlashcards() {
      return flaggedCardsRadio.checked
        ? flashcardSets[currentSetIndex].flashcards.filter(card => card.flagged)
        : flashcardSets[currentSetIndex].flashcards;
    }
  
    function showFlashcard() {
      const currentFlashcards = getCurrentFlashcards();
      if (currentFlashcards.length === 0) {
        flashcardContent.textContent = "No cards available";
        flagIcon.style.display = 'none';
        flashcardCounter.textContent = "0/0";
      } else {
        const card = currentFlashcards[currentFlashcardIndex];
        flashcardContent.textContent = showingFront ? card.front : card.back;
        flagIcon.style.display = 'block';
        flagIcon.style.color = card.flagged ? 'green' : 'grey';
        flashcardCounter.textContent = `${currentFlashcardIndex + 1}/${currentFlashcards.length}`;
      }
    }
  
    function renderSetList() {
      setList.innerHTML = '';
      flashcardSets.forEach((set, index) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = set.title;
        button.classList.add('set-button');
        button.addEventListener('click', () => {
          currentSetIndex = index;
          currentFlashcardIndex = 0;
          renderFlashcards();
          showFlashcard();
        });
  
        const editIcon = document.createElement('i');
        editIcon.classList.add('fas', 'fa-edit');
        editIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          currentSetIndex = index;
          showSetEditPopup();
        });
  
        li.appendChild(button);
        li.appendChild(editIcon);
        setList.appendChild(li);
      });
    }
  
    function renderFlashcards() {
      const currentFlashcards = getCurrentFlashcards();
      // implement rendering logic if needed
    }
  
    function keyDownHandler(event) {
      if (document.activeElement.tagName !== 'INPUT') {
        const currentFlashcards = getCurrentFlashcards();
        switch (event.key) {
          case 'ArrowLeft':
            prevButton.click();
            break;
          case 'ArrowRight':
            nextButton.click();
            break;
          case ' ':
            event.preventDefault();
            flashcardContent.click();
            break;
          case 'f':
            flagIcon.click();
            break;
        }
      }
    }
  
    document.addEventListener('keydown', keyDownHandler);
    flashcardContent.addEventListener('click', () => {
      showingFront = !showingFront;
      showFlashcard();
    });
  
    flagIcon.addEventListener('click', () => {
      const card = getCurrentFlashcards()[currentFlashcardIndex];
      card.flagged = !card.flagged;
      showFlashcard();
    });
  
    prevButton.addEventListener('click', () => {
      const currentFlashcards = getCurrentFlashcards();
      currentFlashcardIndex = (currentFlashcardIndex - 1 + currentFlashcards.length) % currentFlashcards.length;
      showFlashcard();
    });
  
    nextButton.addEventListener('click', () => {
      const currentFlashcards = getCurrentFlashcards();
      currentFlashcardIndex = (currentFlashcardIndex + 1) % currentFlashcards.length;
      showFlashcard();
    });
  
    allCardsRadio.addEventListener('change', showFlashcard);
    flaggedCardsRadio.addEventListener('change', showFlashcard);
    renderSetList();
  
    toggleSidebarButton.addEventListener('click', () => {
      document.querySelector('.flashcard-sidebar').classList.toggle('collapsed');
      if (document.querySelector('.flashcard-sidebar').classList.contains('collapsed')) {
        toggleSidebarButton.style.display = 'block';
        collapseButton.style.display = 'block';
      } else {
        toggleSidebarButton.style.display = 'none';
        collapseButton.style.display = 'none';
      }
    });
  
    collapseButton.addEventListener('click', () => {
      document.querySelector('.flashcard-sidebar').classList.toggle('collapsed');
      toggleSidebarButton.style.display = 'block';
      collapseButton.style.display = 'none';
    });
  
    fileInput.addEventListener('change', handleFileInput);
  
    function showSetEditPopup() {
      setEditTitle.value = flashcardSets[currentSetIndex].title;
      setEditPopup.style.display = 'block';
    }
  
    function saveSetEdit() {
      flashcardSets[currentSetIndex].title = setEditTitle.value;
      saveFlashcardSets();
      renderSetList();
      setEditPopup.style.display = 'none';
    }
  
    function deleteSet() {
      flashcardSets.splice(currentSetIndex, 1);
      if (currentSetIndex >= flashcardSets.length) {
        currentSetIndex = flashcardSets.length - 1;
      }
      saveFlashcardSets();
      renderSetList();
      setEditPopup.style.display = 'none';
      handleNoFlashcards();
    }
  
    function handleNoFlashcards() {
      if (flashcardSets.length === 0) {
        flashcardContent.textContent = "No flashcard sets available. Please import or create a new set.";
        flashcardCounter.textContent = "";
        flagIcon.style.display = 'none';
      } else {
        showFlashcard();
      }
    }
  
    function saveFlashcardEdit() {
      const currentFlashcards = getCurrentFlashcards();
      const card = currentFlashcards[currentFlashcardIndex];
      card.front = flashcardEditTerm.value;
      card.back = flashcardEditDefinition.value;
      saveFlashcardSets();
      showFlashcard();
      flashcardEditPopup.style.display = 'none';
    }
  
    function deleteFlashcard() {
      const currentFlashcards = getCurrentFlashcards();
      currentFlashcards.splice(currentFlashcardIndex, 1);
      if (currentFlashcardIndex >= currentFlashcards.length) {
        currentFlashcardIndex = currentFlashcards.length - 1;
      }
      saveFlashcardSets();
      showFlashcard();
      flashcardEditPopup.style.display = 'none';
    }
  
    async function handleFileInput(event) {
      const file = event.target.files[0];
      const extension = file.name.split('.').pop().toLowerCase();
  
      try {
        let newSetTitle = prompt('Enter title for imported set:', file.name.replace(/\.[^/.]+$/, ""));
        if (!newSetTitle) return;
  
        let flashcards;
        if (extension === 'txt') {
          flashcards = await parseTxtFile(file);
        } else {
          alert('Unsupported file format.');
          return;
        }
  
        flashcardSets.push({ title: newSetTitle, flashcards: flashcards });
        saveFlashcardSets();
        renderSetList();
        showFlashcard();
      } catch (error) {
        alert('Failed to import flashcard set: ' + error.message);
      }
    }
  
    function parseTxtFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
          const lines = text.split('\n');
          const flashcards = lines.map(line => {
            const [term, definition] = line.split(/[-:]/).map(part => part.trim());
            return { front: term, back: definition, flagged: false };
          });
          resolve(flashcards.filter(flashcard => flashcard.front && flashcard.back));
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  
    // Event Listeners for Edit Buttons
    setEditSaveButton.addEventListener('click', saveSetEdit);
    setEditDeleteButton.addEventListener('click', deleteSet);
    setEditCancelButton.addEventListener('click', () => setEditPopup.style.display = 'none');
  
    flashcardEditSaveButton.addEventListener('click', saveFlashcardEdit);
    flashcardEditDeleteButton.addEventListener('click', deleteFlashcard);
    flashcardEditCancelButton.addEventListener('click', () => flashcardEditPopup.style.display = 'none');
  
    document.addEventListener('click', (event) => {
      if (setEditPopup.style.display === 'block' && !setEditPopup.contains(event.target)) {
        setEditPopup.style.display = 'none';
      }
      if (flashcardEditPopup.style.display === 'block' && !flashcardEditPopup.contains(event.target)) {
        flashcardEditPopup.style.display = 'none';
      }
    });
  
    manualAddSaveButton.addEventListener('click', addManualSet);
    manualAddCancelButton.addEventListener('click', () => manualAddPopup.style.display = 'none');
  
    function addManualSet() {
      const newSetTitle = manualSetTitle.value.trim();
      const term = manualAddTerm.value.trim();
      const definition = manualAddDefinition.value.trim();
  
      if (newSetTitle && term && definition) {
        flashcardSets.push({
          title: newSetTitle,
          flashcards: [{ front: term, back: definition, flagged: false }]
        });
        saveFlashcardSets();
        renderSetList();
        manualAddPopup.style.display = 'none';
      } else {
        alert('Please fill in all fields.');
      }
    }
  
    handleNoFlashcards(); // Initial check for no flashcards
  });
  