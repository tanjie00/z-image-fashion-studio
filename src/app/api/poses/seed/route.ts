import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const POSE_DATA = [
  {name: '上半身扶颈站立', description: '上半身扶颈站立', category: 'standing', thumbnail: 'poses/pose_549aea38df.webp', poseData: JSON.stringify({ type: '上半身扶颈站立', bodyPart: 'half', isChildren: false })},
  {name: '上半身扶额站立', description: '上半身扶额站立', category: 'standing', thumbnail: 'poses/pose_16bb19622b.webp', poseData: JSON.stringify({ type: '上半身扶额站立', bodyPart: 'half', isChildren: false })},
  {name: '下半身侧面奔跑', description: '下半身侧面奔跑', category: 'dynamic', thumbnail: 'poses/pose_9ed909b0f4.webp', poseData: JSON.stringify({ type: '下半身侧面奔跑', bodyPart: 'full', isChildren: false })},
  {name: '交叠手托腮', description: '交叠手托腮', category: 'fashion', thumbnail: 'poses/pose_ad59101df5.webp', poseData: JSON.stringify({ type: '交叠手托腮', bodyPart: 'full', isChildren: false })},
  {name: '侧步迈腿半身', description: '侧步迈腿半身', category: 'standing', thumbnail: 'poses/pose_82fbbb0f94.webp', poseData: JSON.stringify({ type: '侧步迈腿半身', bodyPart: 'half', isChildren: false })},
  {name: '侧立托腮半身', description: '侧立托腮半身', category: 'fashion', thumbnail: 'poses/pose_0e7c106e52.webp', poseData: JSON.stringify({ type: '侧立托腮半身', bodyPart: 'half', isChildren: false })},
  {name: '侧身坐姿', description: '侧身坐姿', category: 'sitting', thumbnail: 'poses/pose_ea3aeb0a84.webp', poseData: JSON.stringify({ type: '侧身坐姿', bodyPart: 'full', isChildren: false })},
  {name: '侧身手摸头', description: '侧身手摸头', category: 'fashion', thumbnail: 'poses/pose_2e4a3328ea.webp', poseData: JSON.stringify({ type: '侧身手摸头', bodyPart: 'full', isChildren: false })},
  {name: '侧身插兜曲腿', description: '侧身插兜曲腿', category: 'fashion', thumbnail: 'poses/pose_df754b195e.webp', poseData: JSON.stringify({ type: '侧身插兜曲腿', bodyPart: 'full', isChildren: false })},
  {name: '侧身摆臂行走', description: '侧身摆臂行走', category: 'dynamic', thumbnail: 'poses/pose_68bbf7db35.webp', poseData: JSON.stringify({ type: '侧身摆臂行走', bodyPart: 'full', isChildren: false })},
  {name: '侧身触锁骨', description: '侧身触锁骨', category: 'fashion', thumbnail: 'poses/pose_f1e9d1e413.webp', poseData: JSON.stringify({ type: '侧身触锁骨', bodyPart: 'full', isChildren: false })},
  {name: '儿童下半身侧面奔跑', description: '儿童下半身侧面奔跑', category: 'children', thumbnail: 'poses/pose_184d983485.webp', poseData: JSON.stringify({ type: '儿童下半身侧面奔跑', bodyPart: 'full', isChildren: true })},
  {name: '儿童下半身单膝微曲', description: '儿童下半身单膝微曲', category: 'children', thumbnail: 'poses/pose_e7bc2ff0d0.webp', poseData: JSON.stringify({ type: '儿童下半身单膝微曲', bodyPart: 'full', isChildren: true })},
  {name: '儿童下半身正面前行', description: '儿童下半身正面前行', category: 'children', thumbnail: 'poses/pose_4b6515dd64.webp', poseData: JSON.stringify({ type: '儿童下半身正面前行', bodyPart: 'full', isChildren: true })},
  {name: '儿童下半身正面站立', description: '儿童下半身正面站立', category: 'children', thumbnail: 'poses/pose_e9fb1b3d82.webp', poseData: JSON.stringify({ type: '儿童下半身正面站立', bodyPart: 'full', isChildren: true })},
  {name: '儿童侧步迈腿半身', description: '儿童侧步迈腿半身', category: 'children', thumbnail: 'poses/pose_7a1bba9f23.webp', poseData: JSON.stringify({ type: '儿童侧步迈腿半身', bodyPart: 'half', isChildren: true })},
  {name: '儿童侧身坐姿', description: '儿童侧身坐姿', category: 'children', thumbnail: 'poses/pose_8a6cdb08a8.webp', poseData: JSON.stringify({ type: '儿童侧身坐姿', bodyPart: 'full', isChildren: true })},
  {name: '儿童侧身插兜曲腿', description: '儿童侧身插兜曲腿', category: 'children', thumbnail: 'poses/pose_55b7fd6e99.webp', poseData: JSON.stringify({ type: '儿童侧身插兜曲腿', bodyPart: 'full', isChildren: true })},
  {name: '儿童侧身摆臂行走', description: '儿童侧身摆臂行走', category: 'children', thumbnail: 'poses/pose_7c847f5127.webp', poseData: JSON.stringify({ type: '儿童侧身摆臂行走', bodyPart: 'full', isChildren: true })},
  {name: '儿童动态行走回眸', description: '儿童动态行走回眸', category: 'children', thumbnail: 'poses/pose_0b7db7c124.webp', poseData: JSON.stringify({ type: '儿童动态行走回眸', bodyPart: 'full', isChildren: true })},
  {name: '儿童半身侧面双手插兜', description: '儿童半身侧面双手插兜', category: 'children', thumbnail: 'poses/pose_6bfabbd09e.webp', poseData: JSON.stringify({ type: '儿童半身侧面双手插兜', bodyPart: 'half', isChildren: true })},
  {name: '儿童半身侧面行走', description: '儿童半身侧面行走', category: 'children', thumbnail: 'poses/pose_b632b15050.webp', poseData: JSON.stringify({ type: '儿童半身侧面行走', bodyPart: 'full', isChildren: true })},
  {name: '儿童半身双手托脸笑', description: '儿童半身双手托脸笑', category: 'children', thumbnail: 'poses/pose_30c45e8b55.webp', poseData: JSON.stringify({ type: '儿童半身双手托脸笑', bodyPart: 'half', isChildren: true })},
  {name: '儿童半身扶颈站立', description: '儿童半身扶颈站立', category: 'children', thumbnail: 'poses/pose_4c22531442.webp', poseData: JSON.stringify({ type: '儿童半身扶颈站立', bodyPart: 'half', isChildren: true })},
  {name: '儿童半身扶额站立', description: '儿童半身扶额站立', category: 'children', thumbnail: 'poses/pose_7241289db6.webp', poseData: JSON.stringify({ type: '儿童半身扶额站立', bodyPart: 'half', isChildren: true })},
  {name: '儿童单手叉腰歪头', description: '儿童单手叉腰歪头', category: 'children', thumbnail: 'poses/pose_b75083c1a5.webp', poseData: JSON.stringify({ type: '儿童单手叉腰歪头', bodyPart: 'full', isChildren: true })},
  {name: '儿童双手背后站立', description: '儿童双手背后站立', category: 'children', thumbnail: 'poses/pose_fcedc1c619.webp', poseData: JSON.stringify({ type: '儿童双手背后站立', bodyPart: 'full', isChildren: true })},
  {name: '儿童向前摆臂行走', description: '儿童向前摆臂行走', category: 'children', thumbnail: 'poses/pose_8d997feadc.webp', poseData: JSON.stringify({ type: '儿童向前摆臂行走', bodyPart: 'full', isChildren: true })},
  {name: '儿童奔跑姿态', description: '儿童奔跑姿态', category: 'children', thumbnail: 'poses/pose_bedda06e31.webp', poseData: JSON.stringify({ type: '儿童奔跑姿态', bodyPart: 'full', isChildren: true })},
  {name: '儿童插袋点脚', description: '儿童插袋点脚', category: 'children', thumbnail: 'poses/pose_ee8cb9be40.webp', poseData: JSON.stringify({ type: '儿童插袋点脚', bodyPart: 'full', isChildren: true })},
  {name: '儿童旋转甩臂', description: '儿童旋转甩臂', category: 'children', thumbnail: 'poses/pose_3857fb0b5b.webp', poseData: JSON.stringify({ type: '儿童旋转甩臂', bodyPart: 'full', isChildren: true })},
  {name: '儿童正面交叉腿站立抱头', description: '儿童正面交叉腿站立抱头', category: 'children', thumbnail: 'poses/pose_35845cd043.webp', poseData: JSON.stringify({ type: '儿童正面交叉腿站立抱头', bodyPart: 'full', isChildren: true })},
  {name: '儿童正面单曲腿摸头', description: '儿童正面单曲腿摸头', category: 'children', thumbnail: 'poses/pose_76242df387.webp', poseData: JSON.stringify({ type: '儿童正面单曲腿摸头', bodyPart: 'full', isChildren: true })},
  {name: '儿童正面单腿微曲', description: '儿童正面单腿微曲', category: 'children', thumbnail: 'poses/pose_88e28e9a00.webp', poseData: JSON.stringify({ type: '儿童正面单腿微曲', bodyPart: 'full', isChildren: true })},
  {name: '儿童正面站立全身', description: '儿童正面站立全身', category: 'children', thumbnail: 'poses/pose_9a19d4d06c.webp', poseData: JSON.stringify({ type: '儿童正面站立全身', bodyPart: 'full', isChildren: true })},
  {name: '儿童正面站立半身', description: '儿童正面站立半身', category: 'children', thumbnail: 'poses/pose_5be6db9fed.webp', poseData: JSON.stringify({ type: '儿童正面站立半身', bodyPart: 'half', isChildren: true })},
  {name: '儿童背对站立全身', description: '儿童背对站立全身', category: 'children', thumbnail: 'poses/pose_3a27b5449d.webp', poseData: JSON.stringify({ type: '儿童背对站立全身', bodyPart: 'full', isChildren: true })},
  {name: '儿童背面叉腰后视', description: '儿童背面叉腰后视', category: 'children', thumbnail: 'poses/pose_f5e85d1a5d.webp', poseData: JSON.stringify({ type: '儿童背面叉腰后视', bodyPart: 'full', isChildren: true })},
  {name: '动态行走回眸', description: '动态行走回眸', category: 'dynamic', thumbnail: 'poses/pose_a56c831ae8.webp', poseData: JSON.stringify({ type: '动态行走回眸', bodyPart: 'full', isChildren: false })},
  {name: '半身侧面双手插兜', description: '半身侧面双手插兜', category: 'fashion', thumbnail: 'poses/pose_c52723953e.webp', poseData: JSON.stringify({ type: '半身侧面双手插兜', bodyPart: 'half', isChildren: false })},
  {name: '半身侧面行走', description: '半身侧面行走', category: 'dynamic', thumbnail: 'poses/pose_208794600d.webp', poseData: JSON.stringify({ type: '半身侧面行走', bodyPart: 'full', isChildren: false })},
  {name: '半身叉腰', description: '半身叉腰', category: 'fashion', thumbnail: 'poses/pose_2d18354886.webp', poseData: JSON.stringify({ type: '半身叉腰', bodyPart: 'half', isChildren: false })},
  {name: '半身眺望背手', description: '半身眺望背手', category: 'standing', thumbnail: 'poses/pose_f843e037d6.webp', poseData: JSON.stringify({ type: '半身眺望背手', bodyPart: 'half', isChildren: false })},
  {name: '半身背身回眸', description: '半身背身回眸', category: 'standing', thumbnail: 'poses/pose_602f07ed38.webp', poseData: JSON.stringify({ type: '半身背身回眸', bodyPart: 'half', isChildren: false })},
  {name: '单手叉腰歪头', description: '单手叉腰歪头', category: 'fashion', thumbnail: 'poses/pose_2624d81403.webp', poseData: JSON.stringify({ type: '单手叉腰歪头', bodyPart: 'full', isChildren: false })},
  {name: '单手扶领半身', description: '单手扶领半身', category: 'fashion', thumbnail: 'poses/pose_e21dc101de.webp', poseData: JSON.stringify({ type: '单手扶领半身', bodyPart: 'half', isChildren: false })},
  {name: '单脚后抬叉腰', description: '单脚后抬叉腰', category: 'fashion', thumbnail: 'poses/pose_99d42e039a.webp', poseData: JSON.stringify({ type: '单脚后抬叉腰', bodyPart: 'full', isChildren: false })},
  {name: '单腿微曲手叉腰', description: '单腿微曲手叉腰', category: 'fashion', thumbnail: 'poses/pose_ff0ad8bcde.webp', poseData: JSON.stringify({ type: '单腿微曲手叉腰', bodyPart: 'full', isChildren: false })},
  {name: '单膝微曲', description: '单膝微曲', category: 'standing', thumbnail: 'poses/pose_31586db880.webp', poseData: JSON.stringify({ type: '单膝微曲', bodyPart: 'full', isChildren: false })},
  {name: '双手抱胸半身', description: '双手抱胸半身', category: 'fashion', thumbnail: 'poses/pose_7d9ae89cfd.webp', poseData: JSON.stringify({ type: '双手抱胸半身', bodyPart: 'half', isChildren: false })},
  {name: '双手撩发上举', description: '双手撩发上举', category: 'fashion', thumbnail: 'poses/pose_5aee2771b2.webp', poseData: JSON.stringify({ type: '双手撩发上举', bodyPart: 'full', isChildren: false })},
  {name: '双手背后站立', description: '双手背后站立', category: 'standing', thumbnail: 'poses/pose_7e1d34a381.webp', poseData: JSON.stringify({ type: '双手背后站立', bodyPart: 'full', isChildren: false })},
  {name: '向前摆臂行走', description: '向前摆臂行走', category: 'dynamic', thumbnail: 'poses/pose_ec5d51f425.webp', poseData: JSON.stringify({ type: '向前摆臂行走', bodyPart: 'full', isChildren: false })},
  {name: '奔跑姿态', description: '奔跑姿态', category: 'dynamic', thumbnail: 'poses/pose_29f5ab4309.webp', poseData: JSON.stringify({ type: '奔跑姿态', bodyPart: 'full', isChildren: false })},
  {name: '手放胸前自然站立', description: '手放胸前自然站立', category: 'standing', thumbnail: 'poses/pose_6f79d8c7da.webp', poseData: JSON.stringify({ type: '手放胸前自然站立', bodyPart: 'full', isChildren: false })},
  {name: '托腮叉腰交叉腿', description: '托腮叉腰交叉腿', category: 'fashion', thumbnail: 'poses/pose_d5295a2069.webp', poseData: JSON.stringify({ type: '托腮叉腰交叉腿', bodyPart: 'full', isChildren: false })},
  {name: '插袋点脚', description: '插袋点脚', category: 'fashion', thumbnail: 'poses/pose_3511707704.webp', poseData: JSON.stringify({ type: '插袋点脚', bodyPart: 'full', isChildren: false })},
  {name: '旋转甩臂', description: '旋转甩臂', category: 'dynamic', thumbnail: 'poses/pose_1b77a39d15.webp', poseData: JSON.stringify({ type: '旋转甩臂', bodyPart: 'full', isChildren: false })},
  {name: '正面单腿微曲', description: '正面单腿微曲', category: 'standing', thumbnail: 'poses/pose_bccfa1d3fd.webp', poseData: JSON.stringify({ type: '正面单腿微曲', bodyPart: 'full', isChildren: false })},
  {name: '正面站立下半身', description: '正面站立下半身', category: 'standing', thumbnail: 'poses/pose_2ea1536337.webp', poseData: JSON.stringify({ type: '正面站立下半身', bodyPart: 'full', isChildren: false })},
  {name: '正面站立全身', description: '正面站立全身', category: 'standing', thumbnail: 'poses/pose_fa4d3a1b43.webp', poseData: JSON.stringify({ type: '正面站立全身', bodyPart: 'full', isChildren: false })},
  {name: '正面站立半身', description: '正面站立半身', category: 'standing', thumbnail: 'poses/pose_5084e3f602.webp', poseData: JSON.stringify({ type: '正面站立半身', bodyPart: 'half', isChildren: false })},
  {name: '正面自然前行', description: '正面自然前行', category: 'dynamic', thumbnail: 'poses/pose_d15400a8e3.webp', poseData: JSON.stringify({ type: '正面自然前行', bodyPart: 'full', isChildren: false })},
  {name: '背对站立全身', description: '背对站立全身', category: 'standing', thumbnail: 'poses/pose_f318a1bc07.webp', poseData: JSON.stringify({ type: '背对站立全身', bodyPart: 'full', isChildren: false })},
  {name: '背面叉腰后视', description: '背面叉腰后视', category: 'fashion', thumbnail: 'poses/pose_db7cb00fbd.webp', poseData: JSON.stringify({ type: '背面叉腰后视', bodyPart: 'full', isChildren: false })},
  {name: '领口提拉', description: '领口提拉', category: 'fashion', thumbnail: 'poses/pose_4eaa266679.webp', poseData: JSON.stringify({ type: '领口提拉', bodyPart: 'full', isChildren: false })},
];

export async function POST() {
  try {
    // Delete all existing default poses to re-seed with updated data
    await db.poseTemplate.deleteMany({ where: { isDefault: true } });

    const created = await db.$transaction(
      POSE_DATA.map((pose) =>
        db.poseTemplate.create({
          data: {
            name: pose.name,
            description: pose.description,
            category: pose.category,
            thumbnail: pose.thumbnail,
            poseData: pose.poseData,
            isDefault: true,
          },
        })
      )
    );

    return NextResponse.json({
      message: `Created ${created.length} pose templates with thumbnails`,
      created: created.length,
      poses: created,
    });
  } catch (error) {
    console.error('Failed to seed pose templates:', error);
    return NextResponse.json(
      { error: 'Failed to seed pose templates' },
      { status: 500 }
    );
  }
}
