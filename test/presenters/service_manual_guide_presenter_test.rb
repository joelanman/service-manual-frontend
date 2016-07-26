require 'test_helper'

class ServiceManualGuidePresenterTest < ActiveSupport::TestCase
  test 'presents the basic details required to display a Service Manual Guide' do
    assert_equal "Agile Delivery", presented_guide.title
    assert_equal "service_manual_guide", presented_guide.format
    assert presented_guide.body.size > 10
    assert presented_guide.header_links.size >= 1

    content_owner = presented_guide.content_owners.first
    assert content_owner.title.present?
    assert content_owner.href.present?
  end

  test 'breadcrumbs have a root and a topic link' do
    guide = presented_guide
    assert_equal [
                   { title: "Service manual", url: "/service-manual" },
                   { title: "Agile", url: "/service-manual/agile" },
                   { title: "Agile Delivery" },
                 ],
                 guide.breadcrumbs
  end

  test "breadcrumbs gracefully omit topic if it's not present" do
    presented_guide = presented_guide("links" => {})
    assert_equal [
                   { title: "Service manual", url: "/service-manual" },
                   { title: "Agile Delivery" },
                 ],
                 presented_guide.breadcrumbs
  end

  test "#category_title is the title of the category" do
    guide = presented_guide
    assert_equal 'Agile', guide.category_title
  end

  test "#category_title is the title of the parent for a point" do
    example = GovukContentSchemaTestHelpers::Examples.new.get(
      'service_manual_guide',
      'point_page'
    )

    presenter = ServiceManualGuidePresenter.new(JSON.parse(example))

    assert presenter.category_title, "The Digital Service Standard"
  end

  test "#category_title can be empty" do
    guide = presented_guide("links" => {})
    assert_nil guide.category_title
  end

  test '#content_owners when stored in the links' do
    guide = presented_guide(
      'details' => { 'content_owner' => nil },
      'links' => { 'content_owners' => [{
        "content_id" => "e5f09422-bf55-417c-b520-8a42cb409814",
        "title" => "Agile delivery community",
        "base_path" => "/service-manual/communities/agile-delivery-community",
      }] }
    )

    expected = [
      ServiceManualGuidePresenter::ContentOwner.new(
        "Agile delivery community",
        "/service-manual/communities/agile-delivery-community")
    ]
    assert_equal expected, guide.content_owners
  end

  test "#show_description? is false if not set" do
    refute ServiceManualGuidePresenter.new({}).show_description?
  end

  test '#latest_change returns the details for the most recent change' do
    guide = presented_guide({}, 'with_change_history')

    assert_equal guide.latest_change, {
      note: "This is our latest change",
      reason_for_change: "This is the reason for our latest change"
    }
  end

  test '#previous_changes returns the change history for the guide' do
    guide = presented_guide({}, 'with_change_history')

    assert_equal guide.previous_changes, [
      {
        public_timestamp: "2015-10-08T08:13:12+00:00".to_time,
        note: "This is the previous change",
        reason_for_change: "This is the reason for our previous change"
      },
      {
        public_timestamp: "2015-09-10T16:37:18+00:00".to_time,
        note: "This is another change",
        reason_for_change: "This is why we made this change\nand it has a second line of text"
      }
    ]
  end

private

  def presented_guide(overriden_attributes = {}, example = 'service_manual_guide')
    ServiceManualGuidePresenter.new(
      JSON.parse(GovukContentSchemaTestHelpers::Examples.new.get('service_manual_guide', example)).merge(overriden_attributes)
    )
  end
end
