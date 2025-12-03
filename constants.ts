
import { Language } from './types';

export const GAME_DURATION = 60; // seconds
export const MAX_TARGETS = 6;
export const SPAWN_AREA_WIDTH = 10;
export const SPAWN_AREA_HEIGHT = 6;
export const SPAWN_DISTANCE = 12;
export const TARGET_RADIUS = 0.5;

// Colors
export const COLOR_BG = '#1a1a1a';
export const COLOR_ACCENT = '#00ffcc';
export const COLOR_TARGET = '#00ffff';
export const COLOR_GRID = '#333333';

export const TRANSLATIONS = {
  en: {
    title: "AIM TRAINER",
    subtitle: "IMPROVE YOUR REFLEXES",
    start: "START TRAINING",
    resume: "RESUME",
    restart: "RESTART",
    settings: "SETTINGS",
    mainMenu: "MAIN MENU",
    quit: "QUIT",
    paused: "PAUSED",
    score: "SCORE",
    accuracy: "ACCURACY",
    time: "TIME",
    
    // Settings
    setting_targets: "MAX TARGETS",
    setting_size: "TARGET SIZE",
    setting_crosshair: "CROSSHAIR STYLE",
    setting_language: "LANGUAGE / 语言",
    
    // Report
    report_title: "SESSION COMPLETE",
    report_grade: "GRADE",
    report_consistency: "CONSISTENCY",
    report_avg_reaction: "AVG REACTION",
    report_hits: "HITS",
    report_avg_dist: "AVG DISTANCE",
    report_chart_title: "REACTION TIME HISTORY (MS)",
    play_again: "PLAY AGAIN",
    
    // Grades
    grade_s: "LEGENDARY",
    grade_a: "EXCELLENT",
    grade_b: "GOOD",
    grade_c: "AVERAGE",
    grade_d: "POOR",
    
    consistency_label: "DEVIATION", // Lower is better
  },
  zh: {
    title: "FPS 瞄准训练",
    subtitle: "提升你的反应速度",
    start: "开始训练",
    resume: "继续游戏",
    restart: "重新开始",
    settings: "设置",
    mainMenu: "返回主菜单",
    quit: "退出",
    paused: "游戏暂停",
    score: "得分",
    accuracy: "准确率",
    time: "时间",
    
    // Settings
    setting_targets: "同屏目标数",
    setting_size: "目标大小",
    setting_crosshair: "准星样式",
    setting_language: "语言 / LANGUAGE",
    
    // Report
    report_title: "训练报告",
    report_grade: "综合评级",
    report_consistency: "稳定性",
    report_avg_reaction: "平均反应",
    report_hits: "命中数",
    report_avg_dist: "平均拉枪距离",
    report_chart_title: "反应时间趋势 (毫秒)",
    play_again: "再次挑战",
    
    // Grades
    grade_s: "传说级",
    grade_a: "大师级",
    grade_b: "精英级",
    grade_c: "普通级",
    grade_d: "新手级",
    
    consistency_label: "波动值",
  }
};
