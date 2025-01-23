document.getElementById('sortButton').addEventListener('click', () => {
  const criteria = document.querySelector('input[name="criteria"]:checked').value;
  const order = document.querySelector('input[name="order"]:checked').value;
  
  chrome.runtime.sendMessage(
    {action: 'sortTabs', criteria, order},
    (response) => {
      if (response && response.success) {
        window.close();
      } else {
        alert('Failed to sort tabs. Please try again.');
      }
    }
  );
});
