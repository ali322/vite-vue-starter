deploy:
	@pnpm run build
	@tar zcvf dist.tar.gz dist/
	@scp -C dist.tar.gz root@hyperview.work:/usr/share/nginx/html/wion/
	@ssh root@sj.alichen.top "cd /usr/share/nginx/html/wion/ && rm -rf index.html && rm -rf assets && tar zxvf dist.tar.gz && mv dist/* ."
	@rm -rf dist.tar.gz

.PHONY: deploy