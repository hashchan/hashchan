DIR=${pwd}
SESSIONNAME=HashChan
tmux new-session -s $SESSIONNAME \; \
	send-keys 'vi ${DIR}' C-m \; \
	split-window -v \; \
	split-window -v \; \
	send-keys "cd web && npm run dev" C-m \; \
	split-window -h \; \
	send-keys "cd hardhat && npx hardhat node" C-m \; \
	split-window -h \; \
  send-keys "sleep 4 && cd hardhat && npx hardhat ignition deploy ignition/modules/HashChan.ts --network localhost" C-m \; \



