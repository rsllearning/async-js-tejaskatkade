let refreshInterval = null;
let currentUsername = "";

const usernameInput = document.getElementById("username-input");
const searchBtn = document.getElementById("search-btn");
const statusMsg = document.getElementById("status-msg");
const timerMsg = document.getElementById("timer-msg");
const errorMsg = document.getElementById("error-msg");
const ownerDetailsDiv = document.getElementById("owner-details");
const reposContainer = document.getElementById("repos-container");
const reposHeading = document.getElementById("repos-heading");
const reposList = document.getElementById("repos-list");

// Part 2: Fetch Owner Details using GitHub Users API
async function fetchOwnerDetails(username) {
  const url = `https://api.github.com/users/${username}`;
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error("Invalid username. GitHub user not found!");
  }
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Part 1: Fetch Public Repositories using GitHub REST API
async function fetchRepositories(username) {
  const url = `https://api.github.com/users/${username}/repos`;
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error("Invalid username. Repositories not found!");
  }
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Part 2 (Additional): Asynchronously fetch data for repo owner
async function fetchRepoOwner(ownerUrl) {
  try {
    const response = await fetch(ownerUrl);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Error fetching repo owner details:", err);
    return null;
  }
}

// Display Functions
// Display Owner Details on page (Part 2)
function displayOwner(owner) {
  ownerDetailsDiv.innerHTML = `
    <img src="${owner.avatar_url}" alt="Avatar" class="avatar">
    <strong>${owner.name || owner.login}</strong> (@${owner.login})
    <p>${owner.bio || "No bio available."}</p>
    <p>Public Repositories: ${owner.public_repos} | Followers: ${owner.followers} | Following: ${owner.following}</p>
    <p><a href="${owner.html_url}" target="_blank">View GitHub Profile</a></p>
  `;
  ownerDetailsDiv.style.display = "block";
}

// Display Repositories on page (Part 1) and handle no public repos (Part 4)
async function displayRepositories(repos) {
  reposList.innerHTML = "";
  reposHeading.style.display = "block";

  // Part 4: Handle user with no public repositories
  if (!repos || repos.length === 0) {
    reposList.innerHTML = "<p>This user has no public repositories.</p>";
    return;
  }

  // Display each repository
  for (const repo of repos) {
    const repoDiv = document.createElement("div");
    repoDiv.className = "repo-item";

    repoDiv.innerHTML = `
      <a href="${repo.html_url}" target="_blank">${repo.name}</a>
      <p>${repo.description || "No description provided."}</p>
      <p>Language: ${repo.language || "Not specified"} | Stars: ★ ${repo.stargazers_count} | Forks: ⑂ ${repo.forks_count}</p>
      <p id="owner-for-repo-${repo.id}">Owner: ${repo.owner.login}</p>
    `;

    reposList.appendChild(repoDiv);

    // Additionally asynchronously fetch data for the owner of each repository (Part 2)
    fetchRepoOwner(repo.owner.url).then((ownerData) => {
      const ownerPara = document.getElementById(`owner-for-repo-${repo.id}`);
      if (ownerPara && ownerData) {
        ownerPara.textContent = `Owner: ${ownerData.name || ownerData.login} (@${ownerData.login})`;
      }
    });
  }
}

// Main Async Function (Parts 1, 2, 4, 5)
async function trackRepositories(isRefresh = false) {
  // Clear previous errors
  errorMsg.textContent = "";

  const username = isRefresh ? currentUsername : usernameInput.value.trim();

  if (!username) {
    errorMsg.textContent = "Please enter a GitHub username.";
    return;
  }

  currentUsername = username;

  if (isRefresh) {
    statusMsg.textContent = "Refreshing data...";
  } else {
    statusMsg.textContent = "Fetching data...";
    ownerDetailsDiv.innerHTML = "";
    reposList.innerHTML = "";
    reposHeading.style.display = "none";
  }

  // Part 5: async/await with try...catch
  try {
    // Fetch owner details and repositories asynchronously
    const ownerData = await fetchOwnerDetails(username);
    const reposData = await fetchRepositories(username);

    // Part 1: Display repository information in the console
    console.log("=== Owner Details ===");
    console.log(ownerData);
    console.log("=== Repositories ===");
    console.table(reposData);

    // Display in UI
    displayOwner(ownerData);
    await displayRepositories(reposData);

    statusMsg.textContent = `Last refreshed at: ${new Date().toLocaleTimeString()}`;

    // Part 3: Start 60-second auto-refresh
    startAutoRefresh();

  } catch (error) {
    // Part 4: Error Handling
    console.error("An error occurred:", error.message);
    errorMsg.textContent = error.message;
    statusMsg.textContent = "";

    // Clear interval if user is invalid or error occurs
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      timerMsg.textContent = "";
    }
  }
}

// Part 3: Auto-Refresh every 60 seconds using setInterval()
function startAutoRefresh() {
  // Clear any existing interval first
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  timerMsg.textContent = "Auto-refresh is active (updates every 60 seconds).";

  // Refresh every 60 seconds (60000 milliseconds)
  refreshInterval = setInterval(async () => {
    console.log("Auto-refreshing repository data...");
    await trackRepositories(true);
  }, 60000);
}

// Event Listeners
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    trackRepositories(false);
  });
}

if (usernameInput) {
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      trackRepositories(false);
    }
  });
}

// Export for Node testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fetchOwnerDetails,
    fetchRepositories,
    fetchRepoOwner,
    trackRepositories,
    startAutoRefresh
  };
}
