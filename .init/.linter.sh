#!/bin/bash
cd /home/kavia/workspace/code-generation/link-loop-puzzle-40557-40566/link_loop_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

