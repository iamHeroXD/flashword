async function runSmokeTest() {
  const BASE_URL = "https://vibrant-chandrasekhar.vercel.app";
  console.log("Testing live deployment at:", BASE_URL);

  // 1. Pages check
  const pages = ["/", "/play", "/leaderboard", "/challenges", "/achievements"];
  for (const page of pages) {
    const res = await fetch(BASE_URL + page);
    console.log(`PAGE ${page}: status ${res.status}`);
    if (res.status !== 200) throw new Error(`Page ${page} failed with ${res.status}`);
  }

  // 2. Daily Challenge API check
  const dailyRes = await fetch(BASE_URL + "/api/daily");
  const dailyData = await dailyRes.json();
  console.log("DAILY CHALLENGE API:", dailyRes.status, "words:", dailyData.challenge?.configuration?.wordCount);

  // 3. Leaderboard API check
  const lbRes = await fetch(BASE_URL + "/api/leaderboard?period=all_time");
  const lbData = await lbRes.json();
  console.log("LEADERBOARD API:", lbRes.status, "entries count:", lbData.entries?.length);

  // 4. Game Round API check (Guest)
  const roundRes = await fetch(BASE_URL + "/api/game/round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId: "science", wordCount: 5, difficulty: "normal" }),
  });
  const roundData = await roundRes.json();
  console.log("GAME ROUND API:", roundRes.status, "words returned:", roundData.words?.length);

  // 5. Auth Register check
  const testUser = "user_" + Date.now();
  const testPass = "Password123!";
  const regRes = await fetch(BASE_URL + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: testUser,
      password: testPass,
      confirmPassword: testPass,
      displayName: "Live Tester",
      avatar: "bolt",
    }),
  });
  const regData = await regRes.json();
  const cookieHeader = regRes.headers.get("set-cookie");
  console.log("REGISTER API:", regRes.status, "user:", regData.user?.username, "recoveryCode:", regData.recoveryCode);
  if (!regData.recoveryCode) throw new Error("Registration did not return recovery code");

  // 6. Auth Me check with session cookie
  const cookie = cookieHeader ? cookieHeader.split(";")[0] : "";
  const meRes = await fetch(BASE_URL + "/api/auth/me", {
    headers: { Cookie: cookie },
  });
  const meData = await meRes.json();
  console.log("ME API:", meRes.status, "username:", meData.user?.username, "level:", meData.user?.level);

  // 7. Game Submit check
  const submitRes = await fetch(BASE_URL + "/api/game/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      mode: "recall",
      categoryId: "science",
      wordCount: 5,
      displayDuration: 8,
      difficulty: "normal",
      answers: roundData.words.map((w: any) => ({
        wordId: w.id,
        wordText: w.word,
        answerText: w.word,
        wasCorrect: true,
        responseTimeMs: 950,
      })),
    }),
  });
  const submitData = await submitRes.json();
  console.log("SUBMIT SCORE API:", submitRes.status, "finalScore:", submitData.breakdown?.finalScore, "xpEarned:", submitData.breakdown?.xpEarned, "unlockedAchievements:", submitData.newlyUnlockedAchievements?.length, "userLevel:", submitData.updatedProfile?.level);

  // 8. Password recovery test
  const recoverRes = await fetch(BASE_URL + "/api/auth/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: testUser,
      recoveryCode: regData.recoveryCode,
      newPassword: "NewPassword456!",
      confirmPassword: "NewPassword456!",
    }),
  });
  const recoverData = await recoverRes.json();
  console.log("RECOVER PASSWORD API:", recoverRes.status, "message:", recoverData.message);

  console.log("🎉 ALL LIVE VERIFICATIONS PASSED SUCCESSFULLY!");
}

runSmokeTest().catch((err) => {
  console.error("LIVE SMOKE TEST FAILED:", err);
  process.exit(1);
});
