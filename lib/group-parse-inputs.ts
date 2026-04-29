const CHINESE_WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

const PROCESSED_MESSAGE_PREFIX =
  "【系统标记：该条通知用户已处理并添加入库，请在本次解析中严格忽略此条消息包含的所有任务】"

export type ParseGroupId = "group-1" | "group-2" | "group-4"

export interface GroupParseMessage {
  id: string
  text: string
}

export const SECURITY_MESSAGE_IDS = {
  meetingNotice: "group_1_msg_1",
  scheduleNotice: "group_1_msg_2",
} as const

export const NOTICE_MESSAGE_IDS = {
  innovationNotice: "group_2_msg_1",
  careerCourseNotice: "group_2_msg_2",
} as const

export const MATH_MESSAGE_IDS = {
  studentQuestion: "group_4_msg_1",
  taReply: "group_4_msg_2",
  homeworkNotice: "group_4_msg_3",
  studentReply: "group_4_msg_4",
} as const

function cloneDate(date: Date) {
  return new Date(date.getTime())
}

function shiftDate(date: Date, days: number) {
  const shifted = cloneDate(date)
  shifted.setDate(shifted.getDate() + days)
  return shifted
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatSlashDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}/${month}/${day}`
}

function formatFullDate(date: Date) {
  return `${date.getFullYear()}年${formatMonthDay(date)}`
}

export function getRelativeGroupDates(baseDate = new Date()) {
  const today = cloneDate(baseDate)
  const tomorrow = shiftDate(baseDate, 1)
  const nextWeek = shiftDate(baseDate, 7)

  return {
    today,
    tomorrow,
    nextWeek,
    todayLabel: formatMonthDay(today),
    tomorrowLabel: formatMonthDay(tomorrow),
    todaySlash: formatSlashDate(today),
    tomorrowSlash: formatSlashDate(tomorrow),
    nextWeekSlash: formatSlashDate(nextWeek),
    todayFullLabel: formatFullDate(today),
    tomorrowFullLabel: formatFullDate(tomorrow),
    todayWeekday: CHINESE_WEEKDAYS[today.getDay()],
    tomorrowWeekday: CHINESE_WEEKDAYS[tomorrow.getDay()],
  }
}

export function buildSecurityGroupMessages(): GroupParseMessage[] {
  return [
    {
      id: SECURITY_MESSAGE_IDS.meetingNotice,
      text: `【奖励计划经验宣讲会通知】
会议主题：奖励计划经验宣讲会
会议时间：2026/04/22 14:30-16:30 (GMT+08:00)
腾讯会议链接：https://meeting.tencent.com/dm/xxxx
腾讯会议号：xxx-xxx-xxx`,
    },
    {
      id: SECURITY_MESSAGE_IDS.scheduleNotice,
      text: `【开源安全奖励计划经验宣讲会日程】
讲座时间：2026年4月22日（周三）14:30—16:30
讲座方式：腾讯会议（会议室号：xxx-xxx-xxx）
讲座流程：
14:30—15:00 原创开源软件赛道一等奖分享
15:00—15:30 开源软件改写赛道二等奖分享
15:30—16:00 优秀指导教师分享`,
    },
  ]
}

export function buildNoticeGroupMessages(baseDate = new Date()): GroupParseMessage[] {
  const { tomorrowFullLabel, tomorrowWeekday, tomorrowLabel } = getRelativeGroupDates(baseDate)

  return [
    {
      id: NOTICE_MESSAGE_IDS.innovationNotice,
      text: `【活动预告】"赢在创新大赛"第二十三季第一期
时间：${tomorrowFullLabel}（${tomorrowWeekday}）14:30
地点：***校区***负一层报告厅
请提前15分钟微信签到入场。满10次计两个创新学分，先到先得。
比赛通知链接：https://***.edu.cn/${baseDate.getFullYear()}/0421/***`,
    },
    {
      id: NOTICE_MESSAGE_IDS.careerCourseNotice,
      text: `【就业指导课开课通知】
明天${tomorrowLabel}14点30分，***课室，企业导师给大家授课【简历制作与指导】，大家请携带好简历，课堂上再根据老师的指导完善修改。
@所有人`,
    },
  ]
}

export function buildMathGroupMessages(baseDate = new Date()): GroupParseMessage[] {
  const { tomorrowLabel } = getRelativeGroupDates(baseDate)

  return [
    {
      id: MATH_MESSAGE_IDS.studentQuestion,
      text: "同学A：大家讨论一下，关于函数一致连续性的证明，这里取 δ = ε/2 为什么不行？",
    },
    {
      id: MATH_MESSAGE_IDS.taReply,
      text: "助教：因为你在闭区间上无法保证 δ 的取值对所有点都成立，需要考虑区间端点的特殊情况...",
    },
    {
      id: MATH_MESSAGE_IDS.homeworkNotice,
      text: `老师：请大家在明天（${tomorrowLabel}）晚上20:00前，将第三章课后习题证明（手写版扫描件）上传至超星学习通。
老师：命名格式：学号-姓名-第三章作业。逾期不候！`,
    },
    {
      id: MATH_MESSAGE_IDS.studentReply,
      text: "同学B：收到，谢谢老师。顺便问下第四题的积分区间是 [0,1] 还是 [0, +∞) ？",
    },
  ]
}

export function buildGroupParseMessages(groupId: ParseGroupId, baseDate = new Date()): GroupParseMessage[] {
  switch (groupId) {
    case "group-1":
      return buildSecurityGroupMessages()
    case "group-2":
      return buildNoticeGroupMessages(baseDate)
    case "group-4":
      return buildMathGroupMessages(baseDate)
    default:
      return []
  }
}

export function buildGroupParseInput(
  groupId: ParseGroupId,
  processedMessageIds: string[] = [],
  baseDate = new Date(),
) {
  return buildGroupParseMessages(groupId, baseDate)
    .map((message) =>
      [
        `【消息ID：${message.id}】`,
        processedMessageIds.includes(message.id) ? PROCESSED_MESSAGE_PREFIX : null,
        message.text,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
}

