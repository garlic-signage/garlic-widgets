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

# 1. Widget-Ordner nach .build/<name> kopieren
# 2. js/main.js dort per esbuild bundlen (überschreibt sich selbst, index.html bleibt unverändert)
# 3. Aus der Kopie das .wgt packen
$(DIST_DIR)/%.wgt: %/config.xml
	rm -rf $(BUILD_DIR)/$*
	mkdir -p $(BUILD_DIR)/$*
	cp -R $*/. $(BUILD_DIR)/$*
	$(ESBUILD) $(BUILD_DIR)/$*/js/main.js --bundle --outfile=$(BUILD_DIR)/$*/js/main.js --allow-overwrite
	sed -i.bak 's#<script type="module" *src="js/main.js"></script>#<script src="js/main.js"></script>#' $(BUILD_DIR)/$*/index.html
	rm -f $(BUILD_DIR)/$*/index.html.bak
	cd $(BUILD_DIR)/$* && zip -r ../../$(DIST_DIR)/$*.wgt . -x '.*'
	@echo "Built: $(DIST_DIR)/$*.wgt"

clean:
	rm -rf $(DIST_DIR) $(BUILD_DIR)