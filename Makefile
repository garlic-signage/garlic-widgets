DIST_DIR := dist
WIDGETS  := $(wildcard */config.xml)
TARGETS  := $(patsubst %/config.xml,$(DIST_DIR)/%.wgt,$(WIDGETS))

.PHONY: all clean

all: $(DIST_DIR) $(TARGETS)
	@echo "Done. Widgets in $(DIST_DIR)/"

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

$(DIST_DIR)/%.wgt: %/config.xml
	cd $* && zip -j ../$(DIST_DIR)/$*.wgt *
	@echo "Built: $(DIST_DIR)/$*.wgt"

clean:
	rm -rf $(DIST_DIR)
