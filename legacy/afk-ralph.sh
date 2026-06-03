#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

LOG_FILE="afk_log_$(date +%Y%m%d_%H%M%S).txt"

PROMPT="@project.md @progress4.txt
1. If you have any questions about project, check the documentation of all features at @project.md
2. Find the highest-priority task in @project.md and execute it.
3. Check if database model is complete. If not, complete it using the project structure.
4. Check if the design is responsive and complete. If not, use the frontend-developer agent to complete the design.
5. Check if the backend is complete. If not, do it using the project structure.
6. Check if all endpoints is integrated with the frontend. If not, integrate them.
6,5 Check all unit tests are passing. If not, fix them. Create new tests for the new features.
7. Run your visual regression tests
8. Create a report for each page with the differences found to fix them, be detailed and include screenshots.
9. Append your progress to progress4.txt.
10. Commit your changes.
ONLY WORK ON A SINGLE TASK.

If the ESTOQUE.AUTOS is complete and all features are implemented, 
and padronization of contracts is complete,
and all requirements are met,
and all tests are passing, 
and all design is responsive and complete,
and all backend is complete,
and all endpoints are integrated with the frontend,
output <promise>COMPLETE</promise>."

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

for ((i=1; i<=$1; i++)); do
  log ""
  log "════════════════════════════════════════════════════════"
  log "🔄 ITERAÇÃO $i/$1 - $(date '+%H:%M:%S')"
  log "════════════════════════════════════════════════════════"
  
  START_TIME=$(date +%s)
  
  result=$(claude --dangerously-skip-permissions -p "$PROMPT" 2>&1)
  
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  
  echo "$result" >> "$LOG_FILE"
  
  # Mostra só as últimas 30 linhas no terminal
  echo "$result" | tail -30
  
  log ""
  log "⏱️  Duração: ${DURATION}s"
  log "📝 Log completo: $LOG_FILE"
  
  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    log ""
    log "✅ ESTOQUE.AUTOS COMPLETO após $i iterações!"
    log "🕐 Finalizado em: $(date)"
    exit 0
  fi
  
  # Mostra resumo do progress4.txt se existir
  if [ -f "progress4.txt" ]; then
    log ""
    log "📋 Último progresso:"
    tail -5 progress4.txt | while read line; do log "   $line"; done
  fi
  
  log ""
  log "⏳ Aguardando 5s antes da próxima iteração..."
  sleep 5
done

log ""
log "⚠️  Limite de $1 iterações atingido sem completar."