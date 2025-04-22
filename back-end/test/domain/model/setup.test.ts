/*import { User } from "../../../model/user";
import { Hardware_Components } from "../../../model/hardware_components";
import { Images } from "../../../model/images";
import { Setup } from "../../../model/setup";

const valid_user = new User({id: 1, name: "John Doe", email: "johndoe@gmail.com", password: "password", role: "user", age: 25});

const valid_hardware_component_1 = new Hardware_Components({name: "CPU", details: "Intel i9 10900k", price: 500});
const valid_hardware_component_2 = new Hardware_Components({name: "GPU", details: "Nvidia RTX 3090", price: 1500});

const valid_image_1 = new Images({details: "foto1", url: "fakeurl.com"});
const valid_image_2 = new Images({details: "foto2", url: "fakeurl2.com"});

test('given: valid values, when: creating setup, then: setup is created with those values', () => {
    
    const valid_setup = {
        owner: valid_user,
        details: "This is a setup",
        image_urls: [valid_image_1],
        last_updated: new Date(),
        hardware_components: [valid_hardware_component_1],
        setup_id: 1
    }

    expect(valid_setup.owner).toEqual(valid_user);
    expect(valid_setup.details).toEqual("This is a setup");
    expect(valid_setup.image_urls).toContain(valid_image_1);
    expect(valid_setup.last_updated.getTime()).toBeCloseTo(new Date().getTime(), -2);
    expect(valid_setup.hardware_components).toContain(valid_hardware_component_1);
    expect(valid_setup.setup_id).toEqual(1);
});

test('given: valid values and invalid, when: adding image url, then: image url is added to setup if it inst already in the list', () => {
    
    const setup = new Setup({
        owner: valid_user,
        details: "This is a setup",
        image_urls: [valid_image_1],
        last_updated: new Date(),
        hardware_components: [valid_hardware_component_1],
        setup_id: 1
    });

    setup.addImageUrl(valid_image_2);

    expect(setup.getImageUrls()).toContain(valid_image_2);
    expect(setup.getImageUrls().length).toEqual(2);

    expect(() => setup.addImageUrl(valid_image_2)).toThrowError("Image already exists in the list");
});

test('given: valid values and invalid, when: adding hardware component, then: hardware component is added to setup', () => {
    
    const setup = new Setup({
        owner: valid_user,
        details: "This is a setup",
        image_urls: [valid_image_1],
        last_updated: new Date(),
        hardware_components: [valid_hardware_component_1],
        setup_id: 1
    });

    setup.addHardwareComponent(valid_hardware_component_2);

    expect(setup.getHardwareComponents()).toContain(valid_hardware_component_2);
    expect(setup.getHardwareComponents().length).toEqual(2);

    expect(() => setup.addHardwareComponent(valid_hardware_component_2)).toThrowError("Hardware component already exists in the list");
});

test('given: valid values, when: changing details, then: details are changed', () => {

    const setup = new Setup({
        owner: valid_user,
        details: "This is a setup",
        image_urls: [valid_image_1],
        last_updated: new Date(),
        hardware_components: [valid_hardware_component_1],
        setup_id: 1
    });

    setup.setDetails("This is a new setup");

    expect(setup.getDetails()).toEqual("This is a new setup");
});

test('given: valid values, when: changing last updated, then: last updated is changed', () => {


    const setup = new Setup({
        owner: valid_user,
        details: "This is a setup",
        image_urls: [valid_image_1],
        last_updated: new Date(),
        hardware_components: [valid_hardware_component_1],
        setup_id: 1
    })

    setup.setLastUpdated(new Date())
    
    expect(setup.getLastUpdated().getTime()).toBeCloseTo(new Date().getTime(), -2);
});
*/
