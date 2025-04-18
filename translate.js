async function translateText(text, targetLang) {
  try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const res = await fetch(url);
      if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
          return text; // Fallback to original text on error
      }

      const data = await res.json();
      console.log("API Response:", data[0][0][0]); // Log the response for debugging
      return data[0][0][0]; // Extract translated text
  } catch (error) {
      console.error("Translation failed:", error.message);
      return text; // Fallback to original text on error;
  }
}
module.exports = translateText;
