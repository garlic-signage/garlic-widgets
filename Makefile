DIST_DIR := dist
WIDGETS  := $(wildcard */config.xml)
TARGETS  := $(patsubst %/config.xml,$(DIST_DIR)/%.wgt,$(WIDGETS))

.PHONY: all clean

all: $(DIST_DIR) $(TARGETS)
	@echo "Done. Widgets in $(DIST_DIR)/"

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

$(DIST_DIR)/%.wgt: %/config.xml
	cd $* && zip -r ../$(DIST_DIR)/$*.wgt . -x '.*'
	@echo "Built: $(DIST_DIR)/$*.wgt"

clean:
	rm -rf $(DIST_DIR)
