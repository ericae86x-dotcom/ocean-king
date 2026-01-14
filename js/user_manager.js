// js/user_manager.js
// 负责处理用户信息、头像、分数上传、排行榜拉取

// --- 1. Firebase 配置 (这里必须换成你自己的!) ---
// 从 Firebase 控制台复制粘贴过来
const firebaseConfig = {
  apiKey: "AIzaSyDfdxQMPn76A5WDbCD9SFxtYrwA78Hybn8",
  authDomain: "ocean-king-rank.firebaseapp.com",
  projectId: "ocean-king-rank",
  storageBucket: "ocean-king-rank.firebasestorage.app",
  messagingSenderId: "196935442910",
  appId: "1:196935442910:web:7d593cc504ee95a9797d4f"
};

// --- 2. 初始化 Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class UserManager {
  constructor() {
    this.user = null;
    this.initUser();
  }

  // A. 初始化用户 (自动从 Telegram 获取)
  initUser() {
    // 检查是否在 Telegram 环境中
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
      
      this.user = {
        id: tgUser.id.toString(), // TG ID 必须转字符串
        username: tgUser.username || tgUser.first_name || "Unknown Fish",
        // TG 不直接给高清头像 URL，这里我们先用默认头像，或者你可以接入更复杂的头像代理
        // 简单起见，我们用首字母头像接口
        avatarUrl: tgUser.photo_url || `https://ui-avatars.com/api/?name=${tgUser.first_name}&background=random`
      };
      
      console.log("TG用户登录成功:", this.user.username);
      this.updateUI();

    } else {
      // 如果不在 TG 里 (比如你在电脑浏览器测试)，生成一个假用户
      console.log("未检测到TG环境，使用测试用户");
      const testId = localStorage.getItem("test_user_id") || "test_" + Math.floor(Math.random() * 10000);
      localStorage.setItem("test_user_id", testId);
      
      this.user = {
        id: testId,
        username: "Test Player",
        avatarUrl: "https://ui-avatars.com/api/?name=Test+Player&background=random"
      };
      this.updateUI();
    }
  }

  // B. 更新 UI 显示头像和名字
  updateUI() {
    const avatarImg = document.getElementById("user-avatar");
    const nameSpan = document.getElementById("user-name");
    
    if (avatarImg && this.user.avatarUrl) avatarImg.src = this.user.avatarUrl;
    if (nameSpan) nameSpan.innerText = this.user.username;
  }

  // C. 上传分数 (只有破纪录才传)
  async saveScore(score) {
    if (!this.user) return;

    try {
      const userRef = doc(db, "leaderboard", this.user.id);
      
      // 先查一下旧分数
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const oldScore = docSnap.data().score;
        if (score <= oldScore) return; // 没破纪录，不上传，省流量
      }

      // 破纪录了，上传！
      await setDoc(userRef, {
        username: this.user.username,
        avatar: this.user.avatarUrl,
        score: score,
        updatedAt: new Date()
      });
      console.log("分数已上传云端:", score);
      
    } catch (e) {
      console.error("上传分数失败:", e);
    }
  }

  // D. 拉取排行榜 (Top 10)
  async getLeaderboard() {
    const rankList = document.getElementById("rank-list");
    if (!rankList) return;
    
    rankList.innerHTML = "<li>Loading...</li>";

    try {
      const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      
      rankList.innerHTML = ""; // 清空
      
      let index = 1;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        
        // 简单的排行榜 HTML 结构
        li.innerHTML = `
          <span class="rank-num">${index}.</span>
          <img src="${data.avatar}" class="rank-avatar">
          <span class="rank-name">${data.username}</span>
          <span class="rank-score">${data.score}</span>
        `;
        rankList.appendChild(li);
        index++;
      });
      
    } catch (e) {
      console.error("获取排行榜失败:", e);
      rankList.innerHTML = "<li>Failed to load</li>";
    }
  }
}

// 导出单例，方便全局调用
window.userManager = new UserManager();