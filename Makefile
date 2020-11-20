node_examples := data-upload data-access compute compute2
examples := $(node_examples) account-linking

WORKER="../../offchain-compute/worker/bin/parcel-worker"
CLI="../cli/bin/parcel"

.PHONY: build \
	clean \
	fmt \
	lint \
	test \
	update \


build: $(addsuffix /bin/main.js,$(node_examples))
	
%/bin/main.js: %/src/main.ts
	(cd $* && yarn install && yarn build) || exit 1

clean:
	for e in $(examples); do \
		(cd $$e && rm node_modules -rf && rm -f bin/*.js && rm -f yarn.lock) \
	done

test: $(addsuffix -test,$(examples))

data-upload-test data-access-test: build
	for e in data-upload data-access; do \
		(cd $$e && yarn run run) || exit 1; \
	done

compute-test: build
	../cli/scripts/worker_wrap.sh "cd compute && yarn run run"

compute2-test: build
	../cli/scripts/worker_wrap.sh "cd compute2 && yarn run run"

account-linking-test:
	# TODO: Add account linking step

update:
	for e in $(examples); do \
		(cd $$e && npm update) || exit 1; \
	done

fmt:
	for e in $(node_examples); do \
		(cd $$e && yarn fmt) \
	done

lint:
	for e in $(node_examples); do \
		(cd $$e && yarn lint) || exit 1; \
	done
