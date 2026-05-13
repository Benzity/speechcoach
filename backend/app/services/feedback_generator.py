"""세션 종료 후 누적 데이터를 Claude API에 전달해 종합 피드백 JSON을 생성.

TODO(Phase 6): UC-06 / FR-5.x 구현
- 입력: 직무/이력서 요약 + 질문별 전사/비언어/반언어 요약
- 출력: FR-5.4의 7키 JSON
  (overall_summary, scores, critical_issues, nonverbal_feedback,
   verbal_feedback, practice_tips, positive_points)
"""
