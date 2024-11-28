DIR=${pwd}
SESSIONNAME=HashChan
MNEMONIC=$(grep MNEMONIC ./hardhat/.env | cut -d '=' -f 2-)
tmux new-session -s $SESSIONNAME \; \
	send-keys 'vi ${DIR}' C-m \; \
	split-window -v \; \
	split-window -v \; \
	send-keys "cd web && npm run dev" C-m \; \
	split-window -h \; \
	#send-keys "cd hardhat && anvil --mnemonic '${MNEMONIC}' --block-time 5" C-m \; \
	split-window -h \; \
  send-keys "sleep 4 && cd hardhat && npx hardhat ignition deploy ignition/modules/HashChan2.ts --network localhost --reset" C-m \; \



