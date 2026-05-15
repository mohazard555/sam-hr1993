import axios from 'axios';

// سيتم تحديث هذه القيم من الإعدادات لاحقاً
let GIST_ID = localStorage.getItem('sam_gist_id') || '';
let GIST_TOKEN = localStorage.getItem('sam_gist_token') || '';

export const updateSyncConfig = (id: string, token: string) => {
  GIST_ID = id;
  GIST_TOKEN = token;
  localStorage.setItem('sam_gist_id', id);
  localStorage.setItem('sam_gist_token', token);
};

export const syncDataToGist = async (data: any) => {
  if (!GIST_ID || !GIST_TOKEN) return;

  try {
    await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
      files: {
        'sam_db.json': {
          content: JSON.stringify(data)
        }
      }
    }, {
      headers: { Authorization: `token ${GIST_TOKEN}` }
    });
    return true;
  } catch (error) {
    console.error("Sync Error:", error);
    return false;
  }
};

export const fetchFromGist = async () => {
  if (!GIST_ID || !GIST_TOKEN) return null;

  try {
    const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`, {
        headers: { Authorization: `token ${GIST_TOKEN}` }
    });
    return JSON.parse(response.data.files['sam_db.json'].content);
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
};
