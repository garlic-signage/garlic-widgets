DIST_DIR := dist
BUILD_DIR := .build
WIDGETS  := $(wildcard */config.xml)
TARGETS  := $(patsubst %/config.xml,$(DIST_DIR)/%.wgt,$(WIDGETS))

ESBUILD := $(shell command -v $(ESBUILD_BIN) 2>/dev/null)
ifeq ($(ESBUILD),)
ESBUILD := tools/esbuild
endif

.PHONY: all clean

all: $(DIST_DIR) $(TARGETS)
	@echo "Done. Widgets in $(DIST_DIR)/"

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

# 1. Copy the widget folder to .build/<name>
# 2. Bundle minified js/main.js there using esbuild (it overwrites itself; index.html remains unchanged)
# 3. delete the class files
# 4. Extract the .wgt file from the copy
$(DIST_DIR)/%.wgt: %/config.xml
	rm -rf $(BUILD_DIR)/$*
	mkdir -p $(BUILD_DIR)/$*
	cp -R $*/. $(BUILD_DIR)/$*
	$(ESBUILD) $(BUILD_DIR)/$*/js/main.js --bundle --minify --outfile=$(BUILD_DIR)/$*/js/main.js --allow-overwrite
	find $(BUILD_DIR)/$*/js -name '*.js' ! -path '$(BUILD_DIR)/$*/js/main.js' -delete
	find $(BUILD_DIR)/$*/js -type d -empty -delete
	sed -i.bak 's#<script type="module" *src="js/main.js"></script>#<script src="js/main.js"></script>#' $(BUILD_DIR)/$*/index.html
	rm -f $(BUILD_DIR)/$*/index.html.bak
	cd $(BUILD_DIR)/$* && zip -r ../../$(DIST_DIR)/$*.wgt . -x '.*'
	@echo "Built: $(DIST_DIR)/$*.wgt"

clean:
	rm -rf $(DIST_DIR) $(BUILD_DIR)