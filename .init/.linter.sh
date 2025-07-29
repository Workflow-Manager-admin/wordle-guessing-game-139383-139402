#!/bin/bash
cd /home/kavia/workspace/code-generation/wordle-guessing-game-139383-139402/wordle_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

