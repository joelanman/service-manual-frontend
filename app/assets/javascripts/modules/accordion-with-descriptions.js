(function (Modules) {
  "use strict";

  Modules.AccordionWithDescriptions = function() {

    this.start = function($element) {

      // Indicate that js has worked
      $element.addClass('js-accordion-with-descriptions');

      // Prevent FOUC, remove class hiding content
      $element.removeClass('js-hidden');

      var $subsectionHeaders = $element.find('.subsection__header');
      var totalSubsections = $element.find('.subsection__content').length;

      var $openOrCloseAllButton;
      var GOVUKServiceManualTopic = serviceManualTopicPrefix();

      addOpenCloseAllButton();
      addButtonsToSubsections();
      addIconsToSubsections();
      addAriaControlsAttrForOpenCloseAllButton();

      closeOpenSections();
      checkSessionStorage();
      openLinkedSection();

      bindToggleForSubsections();
      bindToggleOpenCloseAllButton();

      function getserviceManualTopic() {
        return $('h1').text();
      }

      function replaceSpacesWithUnderscores(str) {
        return str.replace(/\s+/g,"_");
      }

      function serviceManualTopicPrefix() {
        var topic = getserviceManualTopic();
        topic = replaceSpacesWithUnderscores(topic);
        topic = topic.toLowerCase();

        return "GOVUK_service_manual_" + topic + "_";
      }

      function addOpenCloseAllButton() {
        $element.prepend( '<div class="subsection-controls js-subsection-controls"><button aria-expanded="false">Open all</button></div>' );
      }

      function addButtonsToSubsections() {
        var $subsectionTitle = $element.find('.subsection__title');

        // Wrap each title in a button, with aria controls matching the ID of the subsection
        $subsectionTitle.each(function(index) {
          $(this).wrapInner( '<button class="subsection__button js-subsection-button" aria-expanded="false" aria-controls="subsection_content_' + index +'"></button>' );
        });
      }

      function addIconsToSubsections() {
        $subsectionHeaders.append( '<span class="subsection__icon"></span>' );
      }

      function addAriaControlsAttrForOpenCloseAllButton() {
        // For each of the sections, create a string with all the subsection content IDs
        var ariaControlsValue = "";
        for (var i = 0; i < totalSubsections; i++) {
          ariaControlsValue += "subsection_content_"+i+" ";
        }

        $openOrCloseAllButton = $element.find('.js-subsection-controls button');

        // Set the aria controls for the open/close all button value for all content items
        $openOrCloseAllButton.attr('aria-controls', ariaControlsValue);
      }

      function closeOpenSections() {
        var $subsectionContent = $element.find('.subsection__content');
        closeSection($subsectionContent);
      }

      function openLinkedSection() {
        var anchor = getActiveAnchor(),
            section;

        if (!anchor.length) {
          return;
        }

        section = $element.find(anchor)
          .parents('.subsection')
          .find('.subsection__content');

        if (section.length) {
          openSection(section);
        }
      }

      function getActiveAnchor() {
        return GOVUK.getCurrentLocation().hash;
      }

      function checkSessionStorage() {

        var $subsectionContent = $element.find('.subsection__content');

        $subsectionContent.each(function(index) {
          var subsectionContentId = $(this).attr('id');
          if(sessionStorage.getItem(GOVUKServiceManualTopic+subsectionContentId)){
            openStoredSections($("#"+subsectionContentId));
          }
        });

        setOpenCloseAllText();
      }

      function setSessionStorage() {
        var isOpenSubsections = $('.subsection--is-open').length;
        if (isOpenSubsections) {
          var $openSubsections = $('.subsection--is-open');
          $openSubsections.each(function(index) {
            var subsectionOpenContentId = $(this).find('.subsection__content').attr('id');
            sessionStorage.setItem( GOVUKServiceManualTopic+subsectionOpenContentId , 'Opened');
          });
        }
      }

      function removeSessionStorage() {
        var isClosedSubsections = $('.subsection').length;
        if (isClosedSubsections) {
          var $closedSubsections = $('.subsection');
          $closedSubsections.each(function(index) {
            var subsectionClosedContentId = $(this).find('.subsection__content').attr('id');
            sessionStorage.removeItem( GOVUKServiceManualTopic+subsectionClosedContentId , subsectionClosedContentId);
          });
        }
      }

      function bindToggleForSubsections() {
        $element.find('.subsection__header').on('click', function(event) {
          var $subsectionHeader = $(this);
          var $subsection = $subsectionHeader.parent('.js-subsection');
          var $subsectionContent = $subsection.find('.js-subsection-content');
          var $subsectionButton = $subsection.find('.js-subsection-button');

          toggleSubsection($subsection);
          toggleIcon($subsection);
          toggleState($subsectionButton);
          setOpenCloseAllText();
          setSessionStorage();
          removeSessionStorage();

          var trackingAction = isSubsectionClosed($subsection) ? 'accordionClosed' : 'accordionOpened';
          var $target = $(event.target);
          if ($target.hasClass('subsection__icon')) {
            var trackingIconType = isSubsectionClosed($subsection) ? 'Minus' : 'Plus';

            var trackingLabel = $subsectionButton.text() + ' - ' + trackingIconType + ' Click';
          } else {
            var trackingLabel = $subsectionButton.text() + ' - Heading Click';
          }

          track('pageElementInteraction', trackingAction, { label: trackingLabel });

          return false;
        });
      }

      function bindToggleOpenCloseAllButton() {
        $openOrCloseAllButton = $element.find('.js-subsection-controls button');
        $openOrCloseAllButton.on('click', function(e) {
          var action = '';

          // update button text
          if ($openOrCloseAllButton.text() == "Open all") {
            $openOrCloseAllButton.text("Close all");
            $openOrCloseAllButton.attr("aria-expanded", "true");
            action = 'open';

            track('pageElementInteraction', 'accordionAllOpened', {
              label: 'Open All'
            });
          } else {
            $openOrCloseAllButton.text("Open all");
            $openOrCloseAllButton.attr("aria-expanded", "false");
            action = 'close';

            track('pageElementInteraction', 'accordionAllClosed', {
              label: 'Close All'
            });
          }

          $element.find('.js-subsection').each(function() {
            var $subsection = $(this);
            var $button = $subsection.find('.js-subsection-button');
            var $subsectionContent = $subsection.find('.js-subsection-content');

            if (action == 'open') {
              $button.attr("aria-expanded", "true");
              $subsectionContent.removeClass('js-hidden');
              $subsection.removeClass('subsection');
              $subsection.addClass('subsection--is-open');
            } else {
              $button.attr("aria-expanded", "false");
              $subsectionContent.addClass('js-hidden');
              $subsection.addClass('subsection');
              $subsection.removeClass('subsection--is-open');
            }
          });

          // Add any open sections to Session Storage
          setSessionStorage();

          // Remove any closed sections from Session Storage
          removeSessionStorage();

          return false;
        });
      }

      function openStoredSections($sectionContent) {
        var $subsection = $sectionContent.parent('.js-subsection');

        toggleSubsection($subsection);
        toggleIcon($sectionContent);
        toggleState($sectionContent.parent().find('.subsection__button'));
        setOpenCloseAllText();
      }

      function setOpenCloseAllText() {
        var openSubsections = $('.subsection--is-open').length;
        // Find out if the number of is-opens == total number of sections
        if (openSubsections === totalSubsections) {
          $openOrCloseAllButton.text('Close all');
        } else {
          $openOrCloseAllButton.text('Open all');
        }
      }

      function isSubsectionClosed($subsection) {
        var $subsectionContent = $subsection.find('.js-subsection-content');

        return $subsectionContent.hasClass('js-hidden');
      }

      function toggleSubsection($subsection) {
        var $subsectionContent = $subsection.find('.js-subsection-content');

        if (isSubsectionClosed($subsection)) {
          openSection($subsectionContent);
        } else {
          closeSection($subsectionContent);
        }
      }

      function toggleIcon($node) {
        if ($($node).parent().hasClass('subsection--is-open')) {
          $node.parent().removeClass('subsection--is-open');
          $node.parent().addClass('subsection');
        } else {
          $node.parent().removeClass('subsection');
          $node.parent().addClass('subsection--is-open');
        }
      }

      function toggleState($node) {
        if ($($node).attr('aria-expanded') == "true") {
          $node.attr("aria-expanded", "false");
        } else {
          $node.attr("aria-expanded", "true");
        }
      }

      function openSection($node) {
        $node.removeClass('js-hidden');
      }

      function closeSection($node) {
        $node.addClass('js-hidden');
      }

      function setExpandedState($node, state) {
        $node.attr("aria-expanded", state);
      }

      function track() {
        if (GOVUK.analytics && GOVUK.analytics.trackEvent) {
          GOVUK.analytics.trackEvent.apply(null, arguments);
        }
      }

    }
  };
})(window.GOVUK.Modules);
